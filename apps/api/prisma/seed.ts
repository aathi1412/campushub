import argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || "campushub_user",
  password: process.env.DB_PASSWORD || "Aathi@2004",
  database: process.env.DB_NAME || "campushub",
});

const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("🌱 Starting CampusHub Database Seeding...");

  // Default demo password: "Password@123"
  const passwordHash = await argon2.hash("Password@123");

  // 1. Seed Users
  console.log("Creating default university users...");
  const admin = await prisma.user.upsert({
    where: { email: "admin@university.edu" },
    update: {},
    create: {
      email: "admin@university.edu",
      name: "Dr. Eleanor Vance",
      password: passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      department: "Office of the Dean",
      bio: "Chief Administrator and Campus Operations Lead.",
    },
  });

  const leader = await prisma.user.upsert({
    where: { email: "leader@university.edu" },
    update: {},
    create: {
      email: "leader@university.edu",
      name: "Marcus Aurelius Chen",
      password: passwordHash,
      role: "CLUB_LEADER",
      status: "ACTIVE",
      department: "Computer Science",
      yearOfStudy: 4,
      bio: "President of the Robotics and Open Source Society.",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@university.edu" },
    update: {},
    create: {
      email: "student@university.edu",
      name: "Sophia Rodriguez",
      password: passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
      department: "Electrical Engineering",
      yearOfStudy: 2,
      bio: "Sophomore passionate about distributed systems and robotics.",
    },
  });

  // 2. Seed Clubs
  console.log("Creating campus organizations...");
  const roboticsClub = await prisma.club.upsert({
    where: { name: "Robotics & Automation Society" },
    update: {},
    create: {
      name: "Robotics & Automation Society",
      description: "Hands-on robotics, autonomous drone builds, and competitive engineering hackathons.",
      category: "TECHNICAL",
      leaderId: leader.id,
      isActive: true,
      memberships: {
        create: [
          { userId: leader.id, role: "LEADER", status: "APPROVED" },
          { userId: student.id, role: "MEMBER", status: "APPROVED" },
        ],
      },
    },
  });

  const devClub = await prisma.club.upsert({
    where: { name: "Campus Open Source Guild" },
    update: {},
    create: {
      name: "Campus Open Source Guild",
      description: "Contributing to real-world open source projects, web applications, and Linux systems.",
      category: "TECHNICAL",
      leaderId: leader.id,
      isActive: true,
      memberships: {
        create: [{ userId: leader.id, role: "LEADER", status: "APPROVED" }],
      },
    },
  });

  // 3. Seed Events
  console.log("Creating featured campus events...");
  const hackathon = await prisma.event.create({
    data: {
      title: "Annual University Hackathon 2026",
      description: "48-hour continuous coding hackathon with industry mentors, prizes, and sponsored catering.",
      category: "TECHNICAL",
      status: "PUBLISHED",
      venue: "Engineering Hall Grand Auditorium & Lab 304",
      startTime: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      endTime: new Date(Date.now() + 9 * 24 * 3600 * 1000),
      registrationDeadline: new Date(Date.now() + 6 * 24 * 3600 * 1000),
      capacity: 150,
      organizerId: leader.id,
      registrations: {
        create: [{ userId: student.id, status: "REGISTERED" }],
      },
    },
  });

  const concert = await prisma.event.create({
    data: {
      title: "Spring Acoustic Under the Stars",
      description: "Live student acoustic bands, refreshments, and campus quad relaxation.",
      category: "CULTURAL",
      status: "PUBLISHED",
      venue: "North Quad Amphitheater",
      startTime: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      endTime: new Date(Date.now() + 14 * 24 * 3600 * 1000 + 4 * 3600 * 1000),
      registrationDeadline: new Date(Date.now() + 13 * 24 * 3600 * 1000),
      capacity: 300,
      organizerId: admin.id,
    },
  });

  // 4. Seed Projects & Kanban Tasks
  console.log("Creating collaborative student projects...");
  const project = await prisma.project.create({
    data: {
      title: "Autonomous Quadcopter Navigation",
      description: "Developing SLAM-based vision navigation for quadcopters inside GPS-denied campus environments.",
      technologies: "ROS2, Python, C++, OpenCV, Gazebo",
      visibility: "CAMPUS_ONLY",
      status: "IN_PROGRESS",
      ownerId: leader.id,
      repoUrl: "https://github.com/university-robotics/drone-nav",
      members: {
        create: [
          { userId: leader.id, role: "OWNER" },
          { userId: student.id, role: "CONTRIBUTOR" },
        ],
      },
      tasks: {
        create: [
          {
            title: "Simulate LiDAR point cloud sensor in Gazebo",
            description: "Set up URDF model and sensor plugins for accurate point cloud data.",
            priority: "HIGH",
            status: "DONE",
            creatorId: leader.id,
            assigneeId: student.id,
          },
          {
            title: "Implement obstacle avoidance trajectory planner",
            description: "Integrate A* path planning node with real-time waypoint streaming.",
            priority: "URGENT",
            status: "IN_PROGRESS",
            creatorId: leader.id,
            assigneeId: leader.id,
          },
          {
            title: "Outdoor flight safety checklist documentation",
            description: "Prepare pre-flight voltage checks and failsafe return-to-home protocol.",
            priority: "LOW",
            status: "TODO",
            creatorId: leader.id,
          },
        ],
      },
    },
  });

  // 5. Seed Community Discussions & Campus Polls
  console.log("Creating community announcements and interactive poll...");
  await prisma.communityPost.create({
    data: {
      authorId: admin.id,
      title: "Campus Library Extended 24/7 Hours During Midterms",
      content: "Starting next Monday, Floors 2 and 3 of the University Central Library will remain open 24 hours. Campus security escorts will be available throughout the night.",
      type: "ANNOUNCEMENT",
      isPinned: true,
    },
  });

  await prisma.communityPost.create({
    data: {
      authorId: student.id,
      title: "Looking for team members for Embedded Systems capstone",
      content: "Hey all! Looking for 1-2 students interested in FPGA hardware acceleration or PCB design for our senior capstone project.",
      type: "GENERAL",
      isPinned: false,
      comments: {
        create: [
          {
            authorId: leader.id,
            content: "Check out the Robotics Lab on Wednesdays at 5 PM! We have test benches and development boards ready.",
          },
        ],
      },
    },
  });

  const poll = await prisma.poll.create({
    data: {
      creatorId: leader.id,
      question: "Which workshop topic would you like the Engineering Society to host next?",
      expiresAt: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      options: {
        create: [
          { text: "Docker & Kubernetes for Developers" },
          { text: "ROS2 & Autonomous Mobile Robotics" },
          { text: "Full-Stack React & Fastify Architectures" },
        ],
      },
    },
    include: { options: true },
  });

  // Seed sample vote
  if (poll.options.length > 0) {
    await prisma.pollVote.create({
      data: {
        pollId: poll.id,
        optionId: poll.options[0].id,
        userId: student.id,
      },
    });
  }

  // 6. Seed In-App Notifications
  console.log("Creating initial in-app notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: student.id,
        type: "EVENT_REGISTRATION",
        title: "Registration Confirmed: Annual Hackathon 2026",
        message: "You have reserved your ticket for the 48-hour coding hackathon.",
        link: `/events/${hackathon.id}`,
        isRead: false,
      },
      {
        userId: student.id,
        type: "TASK_ASSIGNED",
        title: "Task Assigned: Simulate LiDAR point cloud sensor",
        message: "Marcus Chen assigned you a new task in Autonomous Quadcopter Navigation.",
        link: `/projects/${project.id}`,
        isRead: true,
      },
      {
        userId: student.id,
        type: "COMMUNITY_ANNOUNCEMENT",
        title: "Campus Library Extended 24/7 Hours",
        message: "Central Library hours extended for upcoming midterm examinations.",
        link: "/community",
        isRead: false,
      },
    ],
  });

  console.log("✅ Database seeding complete!");
  console.log("Demo Credentials:");
  console.log("  Admin:        admin@university.edu    / Password@123");
  console.log("  Club Leader:  leader@university.edu   / Password@123");
  console.log("  Student:      student@university.edu  / Password@123");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
