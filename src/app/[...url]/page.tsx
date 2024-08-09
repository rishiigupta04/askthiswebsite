// 1.  The Page component is the main component of this application.
// 2.  It receives a set of parameters, which includes an array of URL components.
// 3.  The URL components are decoded and then joined together to form a complete URL.
// 4.  The URL is then checked against a Redis set to see if it has already been indexed.
// 5.  If the URL has not been indexed, it is added to the Redis set and indexed by the RAGChat model.

import { ChatWrapper } from "@/components/ChatWrapper";
import { ragChat } from "@/lib/rag-chat";
import { redis } from "@/lib/redis";

interface PageProps {
  params: {
    url: string | string[] | undefined;
  };
}

function reconstructUrl({ url }: { url: string[] }) {
  const decodedComponents = url.map((component) =>
    decodeURIComponent(component)
  );
  return decodedComponents.join("/");
}

const Page = async ({ params }: PageProps) => {
  // Decode the URL components and join them together to form a complete URL
  const reconstructedUrl = reconstructUrl({ url: params.url as string[] });

  const sessionId = "mock-session";

  // Check if the URL has already been indexed in Redis
  const isAlreadyIndexed = await redis.sismember(
    "indexed-urls", // The Redis set that stores the URLs
    reconstructedUrl // The URL to check against
  );

  // If the URL has not been indexed, add it to the set and index it with the RAGChat model
  if (!isAlreadyIndexed) {
    await ragChat.context.add({
      type: "html", // The type of the context to add
      source: reconstructedUrl, // The URL to add as context
    });

    await redis.sadd("indexed-urls", reconstructedUrl); // Add the URL to the Redis set
  }

  return <ChatWrapper sessionId={sessionId} />;
};

export default Page;
