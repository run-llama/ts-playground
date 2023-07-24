// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { IndexDict, TextNode, VectorStoreIndex } from "llamaindex";

type Input = {
  query: string;
  nodesWithEmbedding: {
    text: string;
    embedding: number[];
  }[];
};

type Output = {
  error?: string;
  payload?: {
    response: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Output>
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { query, nodesWithEmbedding }: Input = req.body;

  const embeddingResults = nodesWithEmbedding.map((config) => {
    return {
      node: new TextNode({ text: config.text }),
      embedding: config.embedding,
    };
  });
  const indexDict = new IndexDict();
  for (const { node } of embeddingResults) {
    indexDict.addNode(node);
  }

  const index = await VectorStoreIndex.init({ indexStruct: indexDict });

  index.vectorStore.add(embeddingResults);
  if (!index.vectorStore.storesText) {
    await index.docStore.addDocuments(
      embeddingResults.map((result) => result.node),
      true
    );
  }
  await index.indexStore?.addIndexStruct(indexDict);
  index.indexStruct = indexDict;

  const queryEngine = index.asQueryEngine();
  const result = await queryEngine.query(query);

  res.status(200).json({ payload: { response: result.response } });
}
