from crewai import Task
from globalState import job_results, currentJob # Assuming this is a globally accessible dictionary
from pydantic import BaseModel

# Import Agents
from agents import (
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

class TaskOutput(BaseModel): 
    message: str

# Initialize currentJob with job_id set to None

def add_event(job_id, task_output):
    """Callback function to store agent outputs in job_results dictionary."""
    try:
        # Handle missing job_id
        if job_id is None:
            print("Warning: Job ID is not set. Using a default job ID.")
            job_id = "default_job_id"
        
        # Serialize task_output if it's a Pydantic model
        if isinstance(task_output, BaseModel):
            try:
                task_output = task_output.model_dump()  # Pydantic v2
            except AttributeError:
                task_output = task_output.dict()  # Pydantic v1 fallback
        
        print("this is task output", task_output)

        # Update job_results
        if job_id in job_results:
            job_results[job_id]["result"].append(task_output)
            print("appended the data to the job results")
        else:
            job_results[job_id] = {"status": "processing", "result": [task_output]}
            print("initialized job_results with new job_id")

    except Exception as e:
        print(f"Error in add_event: {e}")
# Define Tasks

# Collect Financial Data
data_collection_task = Task(
    description=(
        "Collect user-provided financial data, including income, expenses, life goals, "
        "investment preferences, and debt details from {user_data}."
    ),
    expected_output=(
        "A structured dataset containing the user's financial information, ready for analysis in JSON format"
    ),
    agent=data_collection_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Data Collection Agent"
)

# Analyze Financial Data
data_analysis_task = Task(
    description=(
        "Analyze {user_data} to identify spending patterns, savings potential, and investment opportunities. "
        "Provide actionable insights based on {user_query}."
    ),
    expected_output=(
        "Insights into the user's financial health, including surplus income, spending priorities, "
        "and recommendations for savings and investments in JSON format."
    ),
    agent=data_analyst_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Data Analysis Agent"
)

# Manage Loan Repayment
debt_management_task = Task(
    description=(
        "Evaluate loans in {user_data} and create a structured repayment plan "
        "that minimizes interest costs while considering the user's financial capacity."
    ),
    expected_output=(
        "A detailed loan repayment plan, including EMI, total payment, and total interest over the tenure in JSON format."
    ),
    agent=debt_management_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Debt Management Agent"
)

# Prioritize Expenses
budget_optimization_task = Task(
    description=(
        "Analyze expenses from {user_data} and prioritize them based on importance "
        "and alignment with financial goals. Suggest adjustments to optimize spending."
    ),
    expected_output=(
        "A prioritized budget plan categorizing expenses with recommendations for reducing non-essential spending in JSON format."
    ),
    agent=budget_optimization_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Budget Optimization Agent"
)

# Plan for Life Goals
goal_based_planning_task = Task(
    description=(
        "Create personalized financial plans for life goals using {user_data}. "
        "Incorporate timelines and required savings."
    ),
    expected_output=(
        "A step-by-step plan for each life goal, including required monthly savings "
        "and feasibility based on the user's financial situation in JSON format."
    ),
    agent=goal_based_planning_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Goal Based Planning Agent"
)

# Assess Risks
risk_assessment_task = Task(
    description=(
        "Evaluate financial risks using {user_data}, including investments, loans, "
        "and retirement planning. Provide safeguards to mitigate risks."
    ),
    expected_output=(
        "A risk assessment report detailing potential risks and recommended mitigation strategies in JSON format."
    ),
    agent=risk_advisor_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Risk Advisor Agent"
)

# Develop Investment Strategies
strategy_development_task = Task(
    description=(
        "Develop investment strategies based on {user_data} and {user_query}, considering asset classes like stocks, mutual funds, real estate, commodities like gold, silver, cryptocurrencies, and fixed income."
    ),
    expected_output=(
        "A set of personalized investment strategies optimized for the user's financial goals in JSON format."
    ),
    agent=trading_strategy_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Trading Strategy Agent"
)

# Implement Strategies
execution_planning_task = Task(
    description=(
        "Implement approved investment strategies by allocating funds across asset classes "
        "using {user_data}."
    ),
    expected_output=(
        "A detailed execution plan outlining fund allocation and management in JSON format."
    ),
    agent=execution_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Execution Agent"
)

# Manage Crypto Investments
crypto_investment_task = Task(
    description=(
        "Manage cryptocurrency investments using {user_data}. Identify opportunities and optimize portfolios."
    ),
    expected_output=(
        "A cryptocurrency portfolio with recommendations for entry/exit points in JSON format."
    ),
    agent=crypto_investment_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Crypto Investment Agent"
)

# Manage Real Estate Investments
real_estate_investment_task = Task(
    description=(
        "Oversee real estate investments from {user_data}. Evaluate opportunities and manage portfolios."
    ),
    expected_output=(
        "A real estate investment plan with property recommendations and expected returns in JSON format."
    ),
    agent=real_estate_investment_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Real Estate Investment Agent"
)

# Manage Gold Investments
gold_investment_task = Task(
    description=(
        "Manage gold and precious metal investments using {user_data}. Recommend safe-haven asset allocations."
    ),
    expected_output=(
        "A gold investment strategy with allocation percentages and performance metrics in JSON format."
    ),
    agent=gold_investment_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Gold Investment Agent"
)

# Optimize Mutual Fund Investments
mutual_funds_task = Task(
    description=(
        "Select and monitor mutual funds and ETFs from {user_data} to ensure diversification and alignment with goals."
    ),
    expected_output=(
        "A mutual fund portfolio with fund selections and performance projections in JSON format."
    ),
    agent=mutual_funds_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Mutual Funds Agent"
)

# Manage Fixed Income Investments
fixed_income_task = Task(
    description=(
        "Recommend fixed-income products from {user_data} for capital preservation and predictable returns."
    ),
    expected_output=(
        "A fixed-income investment plan with product recommendations and return estimates in JSON format."
    ),
    agent=fixed_income_agent,
    async_execution=False,
    callback=lambda task_output: add_event(currentJob.get("job_id"), task_output),
    output_json=TaskOutput,
    name="Fixed Income Agent"
)

# Export all tasks
__all__ = [
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
]

# Function to Execute Tasks in Order
def execute_tasks(user_data, user_query=None):
    """
    Execute tasks in the correct order based on dependencies.
    """
    # Step 1: Data Collection
    print("Executing Data Collection Task...")
    data_collection_task.execute(inputs={"user_data": user_data})

    # Step 2: Data Analysis
    print("Executing Data Analysis Task...")
    data_analysis_task.execute(inputs={"user_data": user_data, "user_query": user_query})

    # Step 3: Debt Management
    print("Executing Debt Management Task...")
    debt_management_task.execute(inputs={"user_data": user_data})

    # Step 4: Budget Optimization
    print("Executing Budget Optimization Task...")
    budget_optimization_task.execute(inputs={"user_data": user_data})

    # Step 5: Goal-Based Planning
    print("Executing Goal-Based Planning Task...")
    goal_based_planning_task.execute(inputs={"user_data": user_data})

    # Step 6: Risk Assessment
    print("Executing Risk Assessment Task...")
    risk_assessment_task.execute(inputs={"user_data": user_data})

    # Step 7: Strategy Development
    print("Executing Strategy Development Task...")
    strategy_development_task.execute(inputs={"user_data": user_data, "user_query": user_query})

    # Step 8: Execution Planning
    print("Executing Execution Planning Task...")
    execution_planning_task.execute(inputs={"user_data": user_data})

    # Step 9: Investment-Specific Tasks
    print("Executing Crypto Investment Task...")
    crypto_investment_task.execute(inputs={"user_data": user_data})

    print("Executing Real Estate Investment Task...")
    real_estate_investment_task.execute(inputs={"user_data": user_data})

    print("Executing Gold Investment Task...")
    gold_investment_task.execute(inputs={"user_data": user_data})

    print("Executing Mutual Funds Task...")
    mutual_funds_task.execute(inputs={"user_data": user_data})

    print("Executing Fixed Income Task...")
    fixed_income_task.execute(inputs={"user_data": user_data})

    print("All tasks executed successfully!")