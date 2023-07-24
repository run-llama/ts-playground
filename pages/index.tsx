import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Head from "next/head";
import { ChangeEvent, useId, useState } from "react";

import essay from "@/lib/essay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

const DEFAULT_CHUNK_SIZE = 1024;
const DEFAULT_CHUNK_OVERLAP = 20;

export default function Home() {
  const answerId = useId();
  const chunkSizeId = useId();
  const chunkOverlapId = useId();
  const queryId = useId();
  const sourceId = useId();
  const [text, setText] = useState(essay);
  const [query, setQuery] = useState("");
  const [needsNewIndex, setNeedsNewIndex] = useState(true);
  const [buildingIndex, setBuildingIndex] = useState(false);
  const [runningQuery, setRunningQuery] = useState(false);
  const [nodesWithEmbedding, setNodesWithEmbedding] = useState([]);
  const [chunkSize, setChunkSize] = useState(DEFAULT_CHUNK_SIZE);
  const [chunkOverlap, setChunkOverlap] = useState(DEFAULT_CHUNK_OVERLAP);
  const [answer, setAnswer] = useState("");

  return (
    <>
      <Head>
        <title>LlamaIndex.TS Playground</title>
      </Head>
      <main className="flex flex-col mx-2 lg:mx-56 h-full">
        <div className="space-y-2">
          <Label>Settings:</Label>
          <div>
            <Label htmlFor={chunkSizeId}>Chunk Size:</Label>
            <div className="flex flex-row space-x-2">
              <Slider
                defaultValue={[DEFAULT_CHUNK_SIZE]}
                value={[chunkSize]}
                min={1}
                max={3000}
                step={1}
                onValueChange={(values: number[]) => {
                  setChunkSize(values[0]);
                  setNeedsNewIndex(true);
                }}
              />
              <Input
                id={chunkSizeId}
                value={chunkSize}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setChunkSize(parseInt(e.target.value));
                  setNeedsNewIndex(true);
                }}
                className="max-w-[100px]"
              />
            </div>
          </div>
          <div>
            <Label htmlFor={chunkOverlapId}>Chunk Overlap:</Label>
            <div className="flex flex-row space-x-2">
              <Slider
                defaultValue={[DEFAULT_CHUNK_OVERLAP]}
                value={[chunkOverlap]}
                min={1}
                max={600}
                step={1}
                onValueChange={(values: number[]) => {
                  setChunkOverlap(values[0]);
                  setNeedsNewIndex(true);
                }}
              />
              <Input
                id={chunkOverlapId}
                value={chunkOverlap}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setChunkSize(parseInt(e.target.value));
                  setNeedsNewIndex(true);
                }}
                className="max-w-[100px]"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col flex-auto h-3/4 my-2 space-y-2">
          <Label htmlFor={sourceId}>Source text:</Label>
          <Textarea
            id={sourceId}
            value={text}
            className="flex-1"
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              setText(e.target.value);
              setNeedsNewIndex(true);
            }}
          />
        </div>
        <Button
          disabled={!needsNewIndex || buildingIndex || runningQuery}
          onClick={async () => {
            setAnswer("Building index...");
            setBuildingIndex(true);
            setNeedsNewIndex(false);
            // Post the text and settings to the server
            const result = await fetch("/api/splitandembed", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                document: text,
                chunkSize,
                chunkOverlap,
              }),
            });
            const { error, payload } = await result.json();

            if (error) {
              setAnswer(error);
            }

            if (payload) {
              setNodesWithEmbedding(payload.nodesWithEmbedding);
              setAnswer("Index built!");
            }

            setBuildingIndex(false);
          }}
        >
          Build Vector Index
        </Button>
        <div className="my-2 space-y-2">
          <Label htmlFor={queryId}>Query:</Label>
          <div className="flex w-full space-x-2">
            <Input
              id={queryId}
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setQuery(e.target.value);
              }}
            />
            <Button
              type="submit"
              disabled={needsNewIndex || buildingIndex || runningQuery}
              onClick={async () => {
                setAnswer("Running query...");
                setRunningQuery(true);
                // Post the query and nodesWithEmbedding to the server
                const result = await fetch("/api/retrieveandquery", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    query,
                    nodesWithEmbedding,
                  }),
                });

                const { error, payload } = await result.json();

                if (error) {
                  setAnswer(error);
                }

                if (payload) {
                  setAnswer(payload.response);
                }

                setRunningQuery(false);
              }}
            >
              Submit
            </Button>
          </div>
        </div>
        <div className="flex flex-col flex-auto h-1/4 my-2 space-y-2">
          <Label htmlFor={answerId}>Answer:</Label>
          <Textarea className="flex-1" readOnly value={answer} id={answerId} />
        </div>
      </main>
    </>
  );
}
