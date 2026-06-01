# Pareto Frontier Widget - User Guide

## Overview

The **Pareto Frontier Widget** is an interactive visualization tool for exploring trade-offs between **energy consumption** and **execution time** in federated learning (FL) optimization scenarios. It displays optimal configurations computed during the optimization process and allows users to interactively adjust parameters to see how their choices compare to optimal solutions.

---

## What the Graph Shows

The graph displays a **Pareto Frontier** representing the optimal balance between two competing objectives:

- **X-axis (Time • τ)**: Average response time per federated learning round (in seconds)
- **Y-axis (Energy • E)**: Total energy consumption per round (in joules)

### Visual Elements

1. **Blue Curve/Points**: The Pareto frontier showing optimal solutions for different ρ (rho) values
   - Each point represents an optimal configuration balancing energy and time
   - Lower and left points are more efficient (less time, less energy)

2. **Orange Circle (🟠)**: The selected reference/optimal point from the Pareto frontier
   - Corresponds to a specific ρ value selected by the user
   - Shows the optimal configuration for comparison

3. **Green Diamond (🟢)**: Your interactive point
   - Represents the configuration based on your current interactive parameter settings
   - Updates in real-time as you adjust parameters

4. **Dotted Green Line**: Connects your interactive point to the selected optimal point
   - Visualizes the "distance" from optimal
   - Shorter lines indicate closer performance to optimal

---

## Parameters Defined During Optimization

These parameters are **pre-computed** by the Python optimization script (`pareto_opt.py`) and **cannot be modified** in the widget. They define the optimization problem and solution space:

### 1. Network Configuration (`network_config`)

- **Client Distribution**: Number of each device type (e.g., 15 GPUs, 15 Mobiles, 20 Laptops, 40 IoT, 10 HPC)
- **Device Specifications**: For each device type:
  - Computation speed (`comp_speed`)
  - Upload/download speeds (`upload_speed`, `download_speed`)
  - Power consumption for computation, upload, download (in watts)

### 2. FL Problem Parameters (`fl_params_default`)

These define the federated learning optimization problem:

- **L**: Local iterations (default: 0.61)
- **σ (sigma)**: Noise level (default: 1.44)
- **G**: Gradient dissimilarity (default: 5.18)
- **M**: Model parameter scale (default: 5.55)
- **ε (epsilon)**: Target accuracy/convergence threshold (default: 1)
- **A**: Algorithm-specific constant (default: 3.5)

### 3. Optimization Results (`optimal_frontier`)

For each ρ (rho) value tested (0.1 to 0.9 in steps of 0.1):

- **m**: Optimal concurrence level (number of concurrent tasks)
- **routing**: Optimal routing proportions (how work is distributed across device types)
- **τ (tau)**: Resulting time per round
- **energy**: Resulting energy per round
- **throughput**: System throughput (updates per time unit)

### 4. Constraint Ranges (`frontier_stats`)

- **m_min, m_max**: Minimum and maximum concurrence values tested during optimization
  - These define the slider range for interactive concurrence adjustment

---

## Interactive Parameters

These parameters can be **adjusted in real-time** using the widget's sidebar to explore different configurations:

### 1. Reference Point • ρ (Rho)

**Location**: Top of sidebar  
**Control**: Badge selection  
**Range**: 0.1 to 0.9 (9 discrete values)

**What it controls:**

- Selects which Pareto-optimal point to use as your reference
- ρ represents the weight between energy and time objectives during optimization:
  - **Low ρ (0.1-0.3)**: Time-optimized solutions (faster execution, may use more energy)
  - **Medium ρ (0.4-0.6)**: Balanced solutions
  - **High ρ (0.7-0.9)**: Energy-optimized solutions (lower energy, may take longer)

**Effect:**

- Changes the orange reference point on the graph
- Updates all comparison metrics in the bottom panel

---

### 2. Concurrence • m

**Location**: Second section of sidebar  
**Control**: Slider  
**Range**: Dynamic (typically 3 to ~100, based on optimization results)

**What it controls:**

- The number of concurrent federated learning tasks/clients active simultaneously
- Directly affects the queuing network model used to calculate performance

**Effect:**

- **Higher m**: More parallelism
  - Can improve throughput
  - May increase waiting times (queuing delays)
  - Affects energy consumption pattern
- **Lower m**: Less parallelism
  - Reduces queuing overhead
  - May reduce throughput
  - Different energy profile

The optimal m for each ρ is displayed as a reference point on the slider.

---

### 3. Routing • P (Device Weights)

**Location**: Third section of sidebar  
**Control**: Individual sliders for each device type  
**Range**: 0.01 to 3.00 per device type  
**Default**: 1.0 (equal treatment)

**What it controls:**

- Relative priority/weight for assigning work to each device type
- These weights are normalized into routing proportions that sum to 1.0

**How it works:**

```
Final routing proportion for device i =
    (weight_i × device_count_i) / Σ(weight_j × device_count_j)
```

**Effect:**

- **Increase weight**: Device type receives more work
  - Exploits that device's characteristics (speed, energy efficiency)
  - May improve time or energy if device is efficient
- **Decrease weight**: Device type receives less work
  - Reduces reliance on that device type
  - Useful if device is slow or energy-intensive

**Visual feedback:**

- **Colored progress bars** show:
  - **Light bar**: Optimal routing proportion from reference point
  - **Dark bar**: Your current interactive routing proportion
- **Info icon (ⓘ)**: Displays detailed device specifications (speeds, power consumption)

---

### 4. FL Parameters

**Location**: Bottom section of sidebar  
**Control**: Individual sliders (if marked as editable) / Display-only (if fixed)  
**Range**: Varies per parameter (defined in `editable_params`)

---

#### **Problem Definition Parameters** (Fixed during optimization)

These define the federated learning problem characteristics and are set during the optimization process:

#### σ (sigma) - Stochastic Noise Std

- **Default**: 1.44
- **Range**: Typically 0.5 to 3.0
- **What it represents**: The standard deviation of stochastic gradient noise
- **Interpretation**:
  - Quantifies how "noisy" the gradient estimates are across clients
  - Higher σ: More variance in client gradients, requires more communication/computation to achieve convergence
  - Lower σ: More consistent gradients, easier to converge but may indicate less diverse client data
- **Impact on Performance**:
  - Drives the $T_2$ term in time calculation (synchronization overhead)
  - Directly affects minimum time achievable regardless of device allocation
- **Why it matters**: Understanding noise helps explain why certain device allocations are necessary

#### G - Gradient Bound

- **Default**: 5.18
- **Range**: Typically 2.0 to 10.0
- **What it represents**: Bound on the L2-norm of gradients across all clients
- **Interpretation**:
  - Measures the diversity and magnitude of gradient directions
  - Higher G: Larger gradients or more diverse optimization landscapes
  - Lower G: More uniform gradient behavior across clients
- **Impact on Performance**:
  - Enters the $T_3$ (computation) term with square relationship: proportional to $C(m-1)$ where $C = G^2 + \sigma^2$
  - Balances with σ in determining synchronization vs. computation trade-off
- **Why it matters**: Explains which devices are best utilized based on communication vs. computation needs

#### M - Second Derivative Bound

- **Default**: 5.55
- **Range**: Typically 2.0 to 8.0
- **What it represents**: Bound on the Hessian (second-order derivatives) of the loss function
- **Interpretation**:
  - Measures curvature of the optimization landscape
  - Higher M: Sharper, more curved landscape (may have local minima)
  - Lower M: Flatter landscape (smoother convergence)
- **Impact on Performance**:
  - Contributes to $B = 2M^2 + \sigma^2$, affecting synchronization overhead
  - Combines with σ to determine stability and convergence behavior
- **Why it matters**: Indicates problem difficulty; affects how many concurrent rounds (m) are needed

---

#### **Algorithm Control Parameters** (Some may be editable)

#### ε (epsilon) - Convergence Threshold

- **Default**: 1.0
- **Range**: Typically 0.1 to 2.0
- **Editable**: ✓ Yes (if enabled in widget)
- **What it controls**: Target accuracy/epsilon for convergence
- **Effect**:
  - Lower ε (stricter convergence): More rounds needed → higher time and energy
  - Higher ε (looser convergence): Fewer rounds needed → lower time and energy
  - Inverse relationship: $\tau \propto 1/\epsilon$ and $E \propto 1/\epsilon$
- **Use case**: Adjust to find acceptable convergence accuracy for your application

#### A - Algorithm Constant

- **Default**: 3.5
- **Range**: Variable (e.g., 1.0 to 5.0)
- **Editable**: ✓ Yes (if enabled in widget)
- **What it controls**: Algorithm-specific scaling factor
- **Effect**: Scales the overall time and energy estimates proportionally
- **Why adjust**: Tuning parameter that may reflect different FL algorithms or implementation efficiency

#### L - Local Iterations

- **Default**: 0.61
- **Range**: Typically 0.1 to 2.0
- **Editable**: ✓ Yes (if enabled in widget)
- **What it controls**: Number of local training iterations per round on each client
- **Effect**:
  - Higher L: More local computation per round
    - Increases computation energy per device
    - May improve convergence per round (fewer total rounds needed)
    - Can reduce communication overhead relative to computation
  - Lower L: Less local computation per round
    - Reduces per-device computation, but may need more rounds
    - Emphasizes communication overhead
- **Use case**: Balance between frequent communication vs. computation-heavy iterations

---

**Parameter Display Format:**

Each parameter includes:

- **Current value badge** (for editable parameters)
- **Description text** explaining its purpose and effects
- **Min/Max/Default markers** on the slider (for editable parameters)
- **Tooltip information** (for fixed parameters)

---

## Comparison Metrics

The bottom panel shows real-time comparisons between your interactive configuration and the selected reference optimal:

### 1. Time • τ

- **Format**: Seconds (2 decimal places)
- **Badge**: Green if better, red if worse than optimal
- Shows percentage difference from optimal

### 2. Energy • E

- **Format**: Joules (integer)
- **Badge**: Green if better, red if worse than optimal
- Shows percentage difference from optimal

### 3. Throughput • λ

- **Format**: Updates per time unit (4 decimal places)
- **Badge**: Green if higher (better), red if lower than optimal
- **Note**: Higher is better (inverted comparison)

### 4. Concurrence • m

- **Format**: Integer
- **Badge**: Neutral (showing difference percentage)
- **Note**: Not quality-judged (just showing the difference)

---

## Usage Workflow

### Basic Exploration:

1. **Select a reference ρ** → Choose time-focused, energy-focused, or balanced
2. **Observe the orange point** → See where optimal is on the Pareto curve
3. **Adjust interactive parameters** → Explore different configurations
4. **Watch the green point move** → See how your choices affect performance
5. **Check comparison metrics** → Quantify how close you are to optimal

### Advanced Analysis:

1. **Device Weight Tuning**:
   - Increase weights for efficient devices (high speed, low power)
   - Decrease weights for inefficient devices
   - Compare your routing with optimal routing (progress bars)

2. **Concurrence Optimization**:
   - Start at optimal m
   - Increase/decrease to understand sensitivity
   - Note how queuing affects time vs. parallelism benefits

3. **FL Parameter Sensitivity**:
   - Adjust one parameter at a time
   - Observe isolated effects on time and energy
   - Find acceptable trade-offs for your use case

### Reset Function:

Click the **Reset** badge (↻) at the top to restore:

- Concurrence to initial computed value
- All weights to 1.0 (equal treatment)
- FL parameters to defaults from optimization

---

## Technical Notes

### Calculation Method

The widget uses **closed-form queuing network formulas** to evaluate your interactive configuration:

1. **Buzen's Algorithm**: Computes queuing network normalization constants
2. **Mean Value Analysis**: Calculates expected delays and device occupancy
3. **Energy Model**: Sums energy contributions from computation, upload, and download phases
4. **Throughput**: Derived from queuing network solution

These calculations are **exact** for the queuing model and provide instant feedback without running simulations.

### Performance Validation

The widget cross-validates optimal points by recomputing them with default parameters. Typical validation errors should be < 1% (shown in developer console).

### Data Source

All data comes from a JSON file generated by the Python optimization script, containing:

- `optimal_frontier`: Array of optimal solutions for each ρ
- `network_config`: Device specifications and counts
- `fl_params_default`: Default federated learning parameters
- `editable_params`: Definitions for interactive parameter sliders
- `frontier_stats`: Ranges and statistics

---

## Interpretation Tips

### When Your Point is Far from Optimal:

- **Above and right** (worse time and energy): Your configuration is inefficient
  - Try reducing device weights for slow/power-hungry devices
  - Check if concurrence is too high (queuing overhead)
- **Below and left** (better time and energy): May indicate:
  - Unrealistic combination (verify calculations)
  - Different operating regime than optimization assumptions
  - Opportunity for further optimization in solver

### Reading Routing Proportions:

- **Optimal routing** often concentrates work on efficient devices
- **Uniform routing** (all weights = 1) is rarely optimal
- **Device count matters**: High-count device types naturally get more work even with equal weights

### Understanding ρ Trade-offs:

- **Low ρ (0.1)**: Minimize time → uses fast devices heavily, may use more energy
- **High ρ (0.9)**: Minimize energy → uses energy-efficient devices, may take longer
- **Moving along the Pareto frontier** shows fundamental trade-offs in the problem

---

## Troubleshooting

### Green Point Not Appearing:

- Ensure all parameters are within valid ranges
- Check browser console for calculation errors
- Verify data file loaded successfully

### Unrealistic Results:

- **Very high energy/time**: May indicate concurrence too high for network capacity
- **Very low values**: Check if FL parameters are within reasonable ranges
- **NaN or Infinity**: Contact administrator - may indicate corrupted data

### Sidebar Not Opening:

- Click the **sliders icon (⚙)** in the bottom-right area
- Check screen width - sidebar requires minimum 320px

---

## Questions or Issues?

For technical questions about the widget or optimization methodology, contact your system administrator or refer to:

- Widget documentation: `WIDGETS_DOCUMENTATION.md`
- Python optimization script: `storage/pareto_opt.py`
- Implementation: `nextjs-app/src/components/widgets/paretoFrontier.tsx`
