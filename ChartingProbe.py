import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# Generate synthetic data for two states
np.random.seed(2)
num_functions = 30
initial_execution_time = np.random.rand(num_functions) * 200
final_execution_time = initial_execution_time + (np.random.randn(num_functions) * 10)  # Simulate changes

initial_call_frequency = np.random.randint(1, 50, num_functions)
final_call_frequency = initial_call_frequency + np.random.randint(-5, 5, num_functions)  # Simulate changes

functions = np.arange(num_functions)  # Function/Module IDs

# Calculate the differences
execution_time_diff = final_execution_time - initial_execution_time
call_frequency_diff = final_call_frequency - initial_call_frequency

# Plotting in 3D
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')

# Initial data points (before changes)
ax.scatter(functions, initial_call_frequency, initial_execution_time, color='blue', label='Initial', alpha=0.6)

# Final data points (after changes)
ax.scatter(functions, final_call_frequency, final_execution_time, color='red', label='Final', alpha=0.6)

# Arrows indicating change (from initial to final)
ax.quiver(
    functions, initial_call_frequency, initial_execution_time,  # Start points
    np.zeros(num_functions), call_frequency_diff, execution_time_diff,  # Deltas
    color='green', arrow_length_ratio=0.1, linewidth=1.5
)

# Labeling
ax.set_xlabel('Function/Module ID')
ax.set_ylabel('Call Frequency')
ax.set_zlabel('Execution Time (ms)')
ax.legend(loc='best')

plt.show()
