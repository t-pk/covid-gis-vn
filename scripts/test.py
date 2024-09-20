import numpy as np
import scipy.stats as stats

# Các tham số
today_infected_cases = 150  # Giá trị cố định để tính toán xác suất vượt quá
mean_recovered = today_infected_cases  # Trung bình hồi phục bằng số ca nhiễm
std_dev_recovered = 0.1 * today_infected_cases  # Độ lệch chuẩn 10% của số ca nhiễm

# Đặt xác suất vượt quá ngưỡng (từ 1% đến 12%)
probability_exceed_min = 0.01  # 1%
probability_exceed_max = 0.12  # 12%

# Tính toán ngưỡng tương ứng cho xác suất 1% và 12%
threshold_min = mean_recovered + stats.norm.ppf(1 - probability_exceed_min) * std_dev_recovered
threshold_max = mean_recovered + stats.norm.ppf(1 - probability_exceed_max) * std_dev_recovered

# Sinh ngẫu nhiên số ca hồi phục
today_recovered_cases = int(np.random.normal(loc=mean_recovered, scale=std_dev_recovered))
today_recovered_cases = min(today_recovered_cases, today_infected_cases)

# Áp dụng ngưỡng để đảm bảo số ca hồi phục nằm trong khoảng ngưỡng
if today_recovered_cases < threshold_min:
    today_recovered_cases = int(np.random.uniform(threshold_min, threshold_max))
elif today_recovered_cases > threshold_max:
    today_recovered_cases = int(np.random.uniform(threshold_min, threshold_max))

today_recovered_cases = round(today_recovered_cases)

print(f"Today infected cases: {today_infected_cases}")
print(f"Today recovered cases: {today_recovered_cases}")
print(f"Threshold range: {threshold_min} to {threshold_max}")
