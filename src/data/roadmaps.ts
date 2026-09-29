// Learning roadmaps shown in the "Learning in public" section.
// To update progress: change `now` to the id of the stage you are on, rewrite `nowNote`,
// and bump `updated`. Stages before `now` show as done, stages after it as next.

export type Stage = {
  id: string;
  title: string;
  learn: string[]; // what this stage covers
  how: string; // how I'm learning it: courses, books, builds
};

export type Roadmap = {
  id: string;
  name: string;
  why: string;
  now: string; // id of the current stage
  nowNote: string; // one line on what I'm doing right now
  updated: string; // month and year of the last update
  stages: Stage[];
};

export const roadmaps: Roadmap[] = [
  {
    id: 'ai-ml',
    name: 'AI / ML',
    why: 'I already ship LLM features at work. This roadmap is about understanding the models underneath, from the maths up.',
    now: 'foundations',
    nowNote: 'Just starting: refreshing linear algebra and probability with NumPy alongside.',
    updated: 'Sep 2026',
    stages: [
      {
        id: 'foundations',
        title: 'Maths and Python foundations',
        learn: ['Linear algebra', 'Probability and statistics', 'NumPy and pandas'],
        how: '3Blue1Brown for intuition, the Mathematics for Machine Learning book for depth.',
      },
      {
        id: 'classical-ml',
        title: 'Classical machine learning',
        learn: ['Regression and classification', 'Trees and ensembles', 'Validation and metrics'],
        how: "Andrew Ng's Machine Learning Specialization, then Kaggle problems end to end.",
      },
      {
        id: 'deep-learning',
        title: 'Deep learning',
        learn: ['Neural nets and backprop', 'CNNs', 'PyTorch'],
        how: "fast.ai's Practical Deep Learning and Karpathy's Neural Networks: Zero to Hero.",
      },
      {
        id: 'transformers',
        title: 'Transformers and fine-tuning',
        learn: ['Attention', 'Build a small GPT', 'LoRA fine-tuning'],
        how: 'Rebuild nanoGPT from scratch, then the Hugging Face course.',
      },
      {
        id: 'mlops',
        title: 'ML in production',
        learn: ['Serving and latency', 'Monitoring and drift', 'Evals at scale'],
        how: "Chip Huyen's Designing Machine Learning Systems, applied to a real side project.",
      },
    ],
  },
  {
    id: 'robotics',
    name: 'Robotics',
    why: 'Software that moves in the real world. Starting from the basics and building as I go.',
    now: 'robo-foundations',
    nowNote: 'Just starting: rigid-body motion and kinematics from the Modern Robotics course.',
    updated: 'Sep 2026',
    stages: [
      {
        id: 'robo-foundations',
        title: 'Robotics foundations',
        learn: ['Rigid-body motion', 'Forward and inverse kinematics', 'C++ basics'],
        how: 'Modern Robotics by Lynch and Park, with its free Coursera course.',
      },
      {
        id: 'embedded',
        title: 'Electronics and embedded',
        learn: ['Arduino and ESP32', 'Sensors and motors', 'PWM and serial'],
        how: 'Build a small line-following robot from a starter kit.',
      },
      {
        id: 'ros2',
        title: 'ROS 2 and simulation',
        learn: ['Nodes, topics and services', 'TF frames', 'Gazebo'],
        how: 'The official ROS 2 tutorials, then drive a TurtleBot in simulation.',
      },
      {
        id: 'perception',
        title: 'Perception',
        learn: ['OpenCV', 'Depth cameras', 'SLAM basics'],
        how: 'Map a room in simulation, then with a real camera.',
      },
      {
        id: 'control',
        title: 'Planning and control',
        learn: ['PID', 'A* and RRT', 'Model predictive control'],
        how: 'Work through the PythonRobotics examples and rebuild the key ones.',
      },
      {
        id: 'robot-learning',
        title: 'Robot learning',
        learn: ['Reinforcement learning', 'Imitation learning', 'Vision-language-action models'],
        how: "Hugging Face's LeRobot with a low-cost arm, joining AI and robotics.",
      },
    ],
  },
];
