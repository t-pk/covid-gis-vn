import csv
import random
from datetime import datetime, timedelta
import json

# Read the provinces data from the JSON file
def read_provinces_from_json(json_file):
    with open(json_file, "r", encoding="utf-8") as file:
        provinces = json.load(file)
    return provinces

# Example usage
# provinces_file = "./hcm.json"
provinces_file = "./large_provinces.json"
# provinces_file = "./provinces.json"

large_provinces = read_provinces_from_json(provinces_file)

# Read the provinces data from the JSON file
def read_provinces_from_json(json_file):
    with open(json_file, "r", encoding="utf-8") as file:
        provinces = json.load(file)
    return provinces


# Function to generate initial cases
def generate_initial_cases(fr, to):
    return random.randint(fr, to)


# Function to get the growth rate based on the stage
#large province
def get_growth_rate(day_count):
    if day_count <= 60:
        return random.uniform(-0.623, 1.732)
    elif 61 <= day_count <= 120:
        return random.uniform(-0.433, 2.132)
    elif 121 <= day_count <= 180:
        return random.uniform(-0.423, 8.32)
    elif 181 <= day_count <= 240:
        return random.uniform(-0.1, 10.0032)
    elif 241 <= day_count <= 300:
        return random.uniform(-0.03, 8.0032)
    else:
        return random.uniform(-0.05, 12.00332)
def increase_cases(prev_infected, prev_recovered, day_count):
    growth_rate = get_growth_rate(day_count)  # Use the regular stage-based growth rate

    # Handle growth differently for positive and negative growth rates
    if growth_rate >= 0:
        today_infected_cases = round(prev_infected +1 + growth_rate)
        today_recovered_cases = round(prev_recovered+(1 + growth_rate * random.uniform(0.001, 1.8101)))
        today_deaths = round(prev_recovered+(prev_recovered*(random.uniform(-0.989, -0.891))))
    else:
        today_infected_cases = round(prev_infected + (prev_infected * (growth_rate)))
        today_recovered_cases = round(prev_recovered + (prev_recovered * (growth_rate * random.uniform(0.001, 2.1012))))
        today_deaths = round(prev_recovered + (prev_recovered * random.uniform(0.991, 0.89129)))
    print("growth_rate", growth_rate, "prev_infected", prev_infected, "today_infected_cases", today_infected_cases, "day_count", day_count)


    return today_infected_cases, today_recovered_cases, today_deaths

# ho chi minh
# def get_growth_rate(day_count):
#     if day_count <= 60:
#         return random.uniform(-0.123, 4.732)
#     elif 61 <= day_count <= 120:
#         return random.uniform(-0.633, 20.132)
#     elif 121 <= day_count <= 180:
#         return random.uniform(-0.53, 126.32)
#     elif 181 <= day_count <= 240:
#         return random.uniform(-0.45, 35.0032)
#     elif 241 <= day_count <= 300:
#         return random.uniform(-0.3, 46.0032)
#     else:
#         return random.uniform(-0.3, 58.00332)

# def increase_cases(prev_infected, prev_recovered, day_count):
#     growth_rate = get_growth_rate(day_count)  # Use the regular stage-based growth rate

#     # Handle growth differently for positive and negative growth rates
#     if growth_rate >= 0:
#         today_infected_cases = round(prev_infected +1 + growth_rate)
#         today_recovered_cases = round(prev_recovered+(1 + growth_rate * random.uniform(0.0001243, 1.8101)))
#         today_deaths = round(prev_recovered+(prev_recovered*(random.uniform(-0.989, -0.891))))
#     else:
#         today_infected_cases = round(prev_infected + (prev_infected * (growth_rate)))
#         today_recovered_cases = round(prev_recovered + (prev_recovered * (growth_rate * random.uniform(0.0001524, 2.1012))))
#         today_deaths = round(prev_recovered + (prev_recovered * random.uniform(0.991, 0.89129)))
#     print("growth_rate", growth_rate, "prev_infected", prev_infected, "today_infected_cases", today_infected_cases, "day_count", day_count)
#     return today_infected_cases, today_recovered_cases, today_deaths


# other provinces
# def get_growth_rate(day_count):
#     if day_count <= 60:
#         return random.uniform(-0.623, 0.132)
#     elif 61 <= day_count <= 120:
#         return random.uniform(-0.633, 0.132)
#     elif 121 <= day_count <= 180:
#         return random.uniform(-0.23, 0.32)
#     elif 181 <= day_count <= 240:
#         return random.uniform(-0.1, 1.0032)
#     elif 241 <= day_count <= 300:
#         return random.uniform(-0.03, 3.0032)
#     else:
#         return random.uniform(-0.05, 4.00332)
# def increase_cases(prev_infected, prev_recovered, day_count):
#     growth_rate = get_growth_rate(day_count)  # Use the regular stage-based growth rate

#     # Handle growth differently for positive and negative growth rates
#     if growth_rate >= 0:
#         today_infected_cases = round(prev_infected +1 + growth_rate)
#         today_recovered_cases = round(prev_recovered+(1 + growth_rate * random.uniform(0.0001, 1.8101)))
#         today_deaths = round(prev_recovered+(prev_recovered*(random.uniform(-0.989, -0.891))))
#     else:
#         today_infected_cases = round(prev_infected + (prev_infected * (growth_rate)))
#         today_recovered_cases = round(prev_recovered + (prev_recovered * (growth_rate * random.uniform(0.0001, 2.1012))))
#         today_deaths = round(prev_recovered + (prev_recovered * random.uniform(0.991, 0.89129)))

#     return today_infected_cases, today_recovered_cases, today_deaths



# Generate COVID data with stages logic
def generate_covid_data_with_stages(start_date, end_date):
    current_date = start_date
    data = []

    # Initialize cumulative totals for each province
    cumulative_totals = {
        province["tinh_thanh"]: {
            "total_infected_cases": 1,
            "total_recovered_cases": 0,
            "total_deaths": 1,
            "today_infected_cases": 1,
            "today_recovered_cases": 0,
        }
        for province in large_provinces
    }

    day_count = 1  # To track days and apply the correct stage
    
    while current_date <= end_date:
        for province in large_provinces:
            province_name = province["tinh_thanh"]
            longtitude = province["kinh_do"]
            latitude = province["vi_do"]

            prev_infected = cumulative_totals[province_name]["today_infected_cases"]
            prev_recovered = cumulative_totals[province_name]["today_recovered_cases"]

            today_infected_cases, today_recovered_cases, today_deaths = increase_cases(
                prev_infected, prev_recovered, day_count
            )
            if (province_name == "Ha Noi"):
                today_infected_cases = round(today_infected_cases * random.uniform(1.0003, 1.003))
            elif (province_name == "Dong Nai"):
                today_infected_cases = round(today_infected_cases * random.uniform(1.0003, 1.005))
            elif (province_name == "Binh Duong"):
                today_infected_cases = round(today_infected_cases * random.uniform(1.0013, 1.0032))

            # Update cumulative totals
            cumulative_totals[province_name]["today_infected_cases"] = today_infected_cases
            cumulative_totals[province_name]["today_recovered_cases"] = today_recovered_cases
            cumulative_totals[province_name]["total_deaths"] += today_deaths
            cumulative_totals[province_name]["total_infected_cases"] += today_infected_cases

            # Append data to the list
            data.append({
                "province": province_name,
                "total_infected_cases": cumulative_totals[province_name]["total_infected_cases"],
                "today_infected_cases": today_infected_cases,
                "deaths": today_deaths,
                "today_recovered_cases": today_recovered_cases,
                "date": current_date.strftime("%Y-%m-%d"),
                "longtitude": longtitude,
                "latitude": latitude
            })

        # Increment the date and day count
        current_date += timedelta(days=1)
        day_count += 1

    return data


# Generate data from 01/01/2021 to 01/01/2022
start_date = datetime(2021, 1, 1)
end_date = datetime(2022, 1, 1)
covid_data = generate_covid_data_with_stages(start_date, end_date)

# Write data to CSV
with open("hcm1.csv", mode="w", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=[
        "province", "total_infected_cases", "today_infected_cases",
        "deaths", "today_recovered_cases", "date", "longtitude", "latitude"
    ])
    writer.writeheader()
    for row in covid_data:
        writer.writerow(row)

print("Data generation complete. CSV saved as 'hcm1.csv'.")