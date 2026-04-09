import sys
sys.path.append('/Users/abdulazeez/Desktop/fsBackend/.venv/lib')
from dotenv import load_dotenv
load_dotenv()
from crewai import Crew, Process, LLM 
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
import os
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize Manager LLM
llm_manager = LLM(
    model="gemini/gemini-2.0-flash",
    temperature=0.5,
    api_key="AIzaSyCgKIvQ8QGw85YWQ4WDqEwruO9C6aNydl0", 
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

    with open("final_report.txt", "w", encoding="utf-8") as file:
        file.write(str(result))
    print("Final report saved to final_report.txt.")
    

__all__ = [CrewCall]
