# NeuroTrack
Digital biomarker app for tracking neurological changes in MS

## How to Run

1. Download or clone this repository
2. Open the project folder
3. Open `index.html` in your browser

For best results, use a mobile device to enable motion tracking.

## How to Use

1. Start a daily check
2. Input fatigue and balance confidence
3. Complete the reaction test
4. Complete the walking test (on a mobile device)
5. View results and trends
6. Download reports to track changes over time

## Features

- Reaction time tracking
- Walking stability analysis using motion sensors
- Personalized baseline detection
- Trend visualization with graphs
- Downloadable reports



Project Summary
NeuroTrack is a mobile-based system designed to monitor subtle changes in neurological function using digital biomarkers. Many neurological conditions, including multiple sclerosis (MS), progress gradually, with changes often going unnoticed between clinical visits. NeuroTrack addresses this gap by enabling users to perform simple daily tasks, such as reaction time assessments, to establish a personalized baseline of cognitive function. The system then quantifies deviations from a rolling baseline, identifying meaningful changes (not making predictions). In addition to the mobile platform, we have designed a conceptual wearable device (3D prototype) that could passively collect continuous movement and coordination data. This allows for tracking throughout the day, enabling more comprehensive insight into daily neurological function. The platform also incorporates subjective self-reports, such as fatigue and balance confidence, to try and understand why changes in performance may occur. Users can visualize trends, receive alerts when deviations occur, and download reports to support conversations with healthcare providers. NeuroTrack demonstrates how mobile and wearable technologies can work together to enable continuous, accessible brain health monitoring.

Problem Statement
This project was inspired by my father's struggle with Multiple Sclerosis. Imagine waking up, getting out of bed, and not knowing if your legs will support you today. For millions of people living with multiple sclerosis and other neurological conditions, this unpredictability is a daily reality. Neurological conditions like MS can affect people in many different ways. For example, MS can cause muscle weakness, balance issues, and fatigue, generally leading to less stable walking patterns. Another complicated issue about MS is the fact that how much the disease affects you can vary day by day. One day you could be walking with minimal issues, and the next it might be difficult for you to get out of bed or walk without stumbling every step. It is nearly impossible to predict when you will feel good or bad. The goal of this project is to address the lack of continuous, accessible monitoring of these changes. Currently, patients often rely on occasional clinical visits and how they feel, which makes it difficult to detect subtle declines in neurological function early. As a result, important changes in cognitive or motor performance may go unnoticed until symptoms become more severe. There is a need for a simple, everyday tool that allows individuals to track changes in their brain and motor function over time, helping them recognize patterns, respond earlier to potential issues, and make more informed decisions about their health.

Proposed Solution
NeuroTrack is a mobile-based system that captures digital biomarkers through simple daily tasks, such as reaction time testing. The system establishes a personalized baseline using recent performance data and continuously compares new results against this baseline to detect statistically significant deviations from a personalized baseline. In addition to cognitive measurements, NeuroTrack includes a walking stability assessment using smartphone motion sensors. This captures subtle changes in motor control and balance, which are often early indicators of neurological change in conditions such as MS. By combining cognitive and motor signals, the system provides a more comprehensive view of neurological function.

The platform integrates both objective metrics (reaction time and gait stability) and subjective inputs (fatigue and balance confidence) to provide insights. The current prototype was developed as a web-based mobile application using HTML, CSS, and JavaScript. It leverages built-in smartphone capabilities, including touch input for reaction time measurement and motion sensors (accelerometer) for walking stability analysis. Sensor and interaction data are processed in real time to compute rolling baseline estimates, quantify deviations, and generate time-series visualizations In addition, we developed a conceptual wearable device (3D model) designed to passively collect movement and coordination data throughout the day. This enables continuous monitoring without requiring active user input, complementing the mobile-based assessments. For now, the wearable device will contain a Microcontroller (MCU), an Inertial Measurement Unit (IMU), a flash memory, a power management IC (PMIC), a 3.7V Lithium-Polymer pouch cell (LiPo), and a haptic motor. Specifically, the microcontroller will need to be an ultra-low-power chip with built-in Bluetooth Low Energy (BLE) radios built directly into the silicon. Our wearable should be light and convenient to the user, hence it can probably only fit a very small battery (around 150mAh). As the microcontroller takes in data, the BLE will send the data to our phone via Bluetooth and then quickly go into a sleep state where it doesn't consume any power before the next footstep. The IMU combines a 3-axis accelerometer and a 3-axis gyroscope to track foot trajectory and impact. We will most likely use a IMU like the Bosch BMI270 or InvenSense MPU-6050. The Flash Memory will be a small SPI NOR Flash chip, around 4MB or 8MB to buffer the raw walking data when the device is disconnected from the phone once it is out of range or disconnected from Bluetooth. The PMIC provides effective and safe charging for our wearable. The Battery will be a small 3.7V Lithium-Polymer pouch cell. It can provide several days of continuous tracking and fit with our compact design. The Haptic Motor will provide physical feedback to our users through vibrations (using a 3V coin vibration motor).

With our two-part system, we seek to focuses on detecting changes over time rather than attempting to predict disease progression or flare-ups. Our solution fits within early detection and ongoing brain health monitoring, while also supporting treatment awareness and day-to-day well-being.

Impact and Feasability
NeuroTrack benefits individuals with neurological conditions such as MS. By enabling continuous tracking, it supports earlier awareness of potential changes and encourages more informed self-management. For example, a user may notice a gradual decline in walking stability over several days, even if they do not consciously feel different. The system can highlight this trend, prompting the user to rest, adjust activity levels, or consult a healthcare provider earlier than they otherwise would. NeuroTrack may also help users recognize patterns of change that precede flare-ups in conditions like MS. By identifying deviations from a personal baseline, the system supports earlier awareness and more proactive self-management without making predictive medical claims. The system is very feasible, using existing smartphone capabilities and simple user interactions. The current prototype demonstrates core functionality, including data collection, baseline calculation, trend visualization, and report generation. NeuroTrack is scalable as a mobile application and can be extended to integrate additional biomarkers or clinical workflows in the future.

Innovation and Differentiation
NeuroTrack differentiates itself by combining active and passive monitoring into one system. Many monitoring approaches rely on generalized thresholds or population-level benchmarks. NeuroTrack instead focuses on baseline tracking based on each person, allowing it to detect subtle, individualized changes over time. The addition of a conceptual wearable device extends the system’s capabilities by enabling passive, continuous data collection, allowing for a more in depth look into how the body feels throughout the entire day. In this way, the user would be able to make more informed decisions about what affects them on a daily basis. By integrating subjective self-reports with objective digital biomarkers across both mobile and wearable platforms, NeuroTrack provides a more holistic and practical approach to brain health monitoring.

While NeuroTrack is motivated by multiple sclerosis, this approach can be applied more broadly to monitor changes in cognitive and motor function across other neurological and brain health conditions.

