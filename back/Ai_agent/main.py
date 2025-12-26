from dotenv import load_dotenv
load_dotenv()

from graph.graph import app

if __name__ == "__main__":
    print("AI-agent is running...")
    answer = app.invoke(input={"query": "מתי הוקמה עיריית עומר?", "context_window": "","self_location": "122.46,31.23"})
    print("Final Answer:", answer["final_answer"])