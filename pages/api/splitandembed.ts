// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  Document,
  MetadataMode,
  SentenceSplitter,
  VectorStoreIndex,
  getNodesFromDocument,
  serviceContextFromDefaults,
} from "llamaindex";
import type { NextApiRequest, NextApiResponse } from "next";

type Input = {
  document: string;
  chunkSize?: number;
  chunkOverlap?: number;
};

type Output = {
  error?: string;
  payload?: {
    nodesWithEmbedding: {
      text: string;
      embedding: number[];
    }[];
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Output>,
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { document, chunkSize, chunkOverlap }: Input = req.body;

  const nodes = getNodesFromDocument(
    new Document({ text: document }),
    new SentenceSplitter({ chunkSize, chunkOverlap }),
  );

  const nodesWithEmbeddings = await VectorStoreIndex.getNodeEmbeddingResults(
    nodes,
    serviceContextFromDefaults(),
    true,
  );

  res.status(200).json({
    payload: {
      nodesWithEmbedding: nodesWithEmbeddings.map((nodeWithEmbedding) => ({
        text: nodeWithEmbedding.getContent(MetadataMode.NONE),
        embedding: nodeWithEmbedding.getEmbedding(),
      })),
    },
  });
}
