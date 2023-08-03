import Head from "next/head";
import { ChangeEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkedSlider } from "@/components/ui/linkedslider";
import { Textarea } from "@/components/ui/textarea";
import essay from "@/lib/essay";

const DEFAULT_CHUNK_SIZE = 1024;
const DEFAULT_CHUNK_OVERLAP = 20;
const DEFAULT_TOP_K = 2;
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_TOP_P = 0;

export default function Home() {
  const answerId = useId();
  const chunkSizeId = useId();
  const chunkOverlapId = useId();
  const queryId = useId();
  const sourceId = useId();
  const topKId = useId();
  const [text, setText] = useState(essay);
  const [query, setQuery] = useState("");
  const [needsNewIndex, setNeedsNewIndex] = useState(true);
  const [buildingIndex, setBuildingIndex] = useState(false);
  const [runningQuery, setRunningQuery] = useState(false);
  const [nodesWithEmbedding, setNodesWithEmbedding] = useState([]);
  const [chunkSize, setChunkSize] = useState(DEFAULT_CHUNK_SIZE);
  const [chunkOverlap, setChunkOverlap] = useState(DEFAULT_CHUNK_OVERLAP);
  const [topK, setTopK] = useState(DEFAULT_TOP_K);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [topP, setTopP] = useState(DEFAULT_TOP_P);
  const [answer, setAnswer] = useState("");

  return (
    <>
      <Head>
        <title>LlamaIndex.TS Playground</title>
      </Head>
      <main className="mx-2 flex h-full flex-col lg:mx-56">
        <div className="space-y-2">
          <Label>Settings:</Label>
          <div>
            <LinkedSlider
              label="Chunk Size:"
              description={
                "The maximum size of the chunks we are searching over, in tokens. " +
                "The bigger the chunk, the more likely that the information you are looking " +
                "for is in the chunk, but also the more likely that the chunk will contain " +
                "irrelevant information."
              }
              min={1}
              max={3000}
              step={1}
              value={chunkSize}
              onChange={(value: number) => {
                setChunkSize(value);
                setNeedsNewIndex(true);
              }}
            />
          </div>
          <div>
            <LinkedSlider
              label="Chunk Overlap:"
              description={
                "The maximum amount of overlap between chunks, in tokens. " +
                "Overlap helps ensure that sufficient contextual information is retained."
              }
              min={1}
              max={600}
              step={1}
              value={chunkOverlap}
              onChange={(value: number) => {
                setChunkOverlap(value);
                setNeedsNewIndex(true);
              }}
            />
          </div>
        </div>
        <div className="my-2 flex h-3/4 flex-auto flex-col space-y-2">
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
        <LinkedSlider
          className="my-2"
          label="Top K:"
          description={
            "The maximum number of chunks to return from the search. " +
            "It's called Top K because we are retrieving the K nearest neighbors of the query."
          }
          min={1}
          max={15}
          step={1}
          value={topK}
          onChange={(value: number) => {
            setTopK(value);
          }}
        />

        <LinkedSlider
          className="my-2"
          label="Temperature:"
          description={"Fill in"}
          min={0}
          max={1}
          step={0.1}
          value={temperature}
          onChange={(value: number) => {
            setTemperature(value);
          }}
        />

        <LinkedSlider
          className="my-2"
          label="Top P:"
          description={"Fill in"}
          min={0}
          max={1}
          step={0.1}
          
          value={topP}
          onChange={(value: number) => {
            setTopP(value);
          }}
        />

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
                    topK,
                    nodesWithEmbedding,
                    temperature,
                    topP,
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
        <div className="my-2 flex h-1/4 flex-auto flex-col space-y-2">
          <Label htmlFor={answerId}>Answer:</Label>
          <Textarea className="flex-1" readOnly value={answer} id={answerId} />
        </div>
      </main>
    </>
  );
}
