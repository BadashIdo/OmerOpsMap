import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from fastapi.responses import StreamingResponse
import json


from graph.graph import app as agent_app


class AskRequest(BaseModel):
    query: str
    context_window: str | None = ""
    self_location: str | None = ""  


class AskResponse(BaseModel):
    final_answer: str
    tool_results: dict | None = None


app = FastAPI(title="AI Agent API", version="0.1")

# בפרונט (localhost:5173/3000) תצטרך CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


import traceback
from fastapi import HTTPException

@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    try:
        result = await agent_app.ainvoke(
            {
                "query": req.query,
                "context_window": req.context_window or "",
                "self_location": req.self_location or "",
            }
        )
        return AskResponse(
            final_answer=result.get("final_answer", ""),
            tool_results=result.get("tool_results", None),
        )

    except Exception as e:
        print("\n=== /ask ERROR ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/ask/stream")
async def ask_stream(req: AskRequest):
    async def event_generator():
        try:
            async for event in agent_app.astream(
                {
                    "query": req.query,
                    "context_window": req.context_window or "",
                    "self_location": req.self_location or "",
                }
            ):
                
                if isinstance(event, dict):
                    chunk = event.get("final_answer")
                    if chunk:
                        yield f"data: {json.dumps({'token': chunk}, ensure_ascii=False)}\n\n"

            
            yield "data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
