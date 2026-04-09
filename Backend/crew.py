import os
from dotenv import load_dotenv
from crewai import Crew, Process, LLM

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"), override=True)
from agents import (
    manager_agent,
    data_collection_agent,
    data_analyst_agent,
    debt_management_agent,
    budget_optimization_agent,
    goal_based_planning_agent,
    risk_advisor_agent,
    trading_strategy_agent,
    execution_agent,
    crypto_investment_agent,
    real_estate_investment_agent,
    gold_investment_agent,
    mutual_funds_agent,
    fixed_income_agent
)
from tasks import (
    data_collection_task,
    data_analysis_task,
    debt_management_task,
    budget_optimization_task,
    goal_based_planning_task,
    risk_assessment_task,
    strategy_development_task,
    execution_planning_task,
    crypto_investment_task,
    real_estate_investment_task,
    gold_investment_task,
    mutual_funds_task,
    fixed_income_task
)
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

OLLAMA_API_KEY = (os.getenv("OLLAMA_API_KEY") or "").strip()
if not OLLAMA_API_KEY:
    raise ValueError("Missing OLLAMA_API_KEY in environment/.env")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://ollama.com").rstrip("/")
if OLLAMA_BASE_URL.endswith("/api"):
    OLLAMA_BASE_URL = OLLAMA_BASE_URL[:-4]

# Initialize Manager LLM
llm_manager = LLM(
    model="ollama_chat/deepseek-v3.1:671b-cloud",
    base_url=OLLAMA_BASE_URL,
    temperature=0.5,
    api_key=OLLAMA_API_KEY,
    verbose=True
)

# Create Crew
crew = Crew(
    agents=[
        manager_agent,
        data_collection_agent,
        data_analyst_agent,
        debt_management_agent,
        budget_optimization_agent,
        goal_based_planning_agent,
        risk_advisor_agent,
        trading_strategy_agent,
        execution_agent,
        crypto_investment_agent,
        real_estate_investment_agent,
        gold_investment_agent,
        mutual_funds_agent,
        fixed_income_agent
    ],
    tasks=[
        data_collection_task,
        data_analysis_task,
        debt_management_task,
        budget_optimization_task,
        goal_based_planning_task,
        risk_assessment_task,
        strategy_development_task,
        execution_planning_task,
        crypto_investment_task,
        real_estate_investment_task,
        gold_investment_task,
        mutual_funds_task,
        fixed_income_task
    ],
    verbose=True,
    manager_llm=llm_manager,
    process=Process.hierarchical,
)
def CrewCall(user_inputs):
    result = crew.kickoff(inputs=user_inputs)
    print(result)
    return str(result)
    

__all__ = [CrewCall]
