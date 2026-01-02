from dotenv import load_dotenv
load_dotenv()

import asyncio
from graph.graph import app

if __name__ == "__main__":
    print("AI Agent is running...")

    result = asyncio.run(
        app.ainvoke(
            {
                "query": "מתי הוקמה עיריית עומר?",
                "context_window": "",
                "self_location": "31.26,34.80",
            }
        )
    )

    print("Final answer:", result.get("final_answer"))
    print("AI Agent has finished execution.")