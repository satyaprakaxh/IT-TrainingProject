
const prisma = require('../src/config/db');

async function main() {
  try {
    // =====================================
    // 1. CREATE SKILLS
    // =====================================

    const skills = [
      {
        name: 'JavaScript',
        description: 'Programming with JavaScript',
        category: 'Programming',
      },
      {
        name: 'React',
        description: 'Building user interfaces using React',
        category: 'Frontend',
      },
      {
        name: 'Node.js',
        description: 'Backend development using Node.js',
        category: 'Backend',
      },
      {
        name: 'SQL',
        description: 'Database management using SQL',
        category: 'Database',
      },
      {
        name: 'Networking',
        description: 'Computer networking fundamentals',
        category: 'Networking',
      },
      {
        name: 'Cybersecurity',
        description: 'Security concepts and practices',
        category: 'Security',
      },
      {
        name: 'Python',
        description: 'Programming with Python',
        category: 'Programming',
      },
      {
        name: 'Git',
        description: 'Version control using Git',
        category: 'Development Tools',
      },
    ];

    for (const skill of skills) {
      await prisma.skill.upsert({
        where: { name: skill.name },
        update: {
          description: skill.description,
          category: skill.category,
        },
        create: skill,
      });
    }

    console.log('Skills created successfully!');

    // =====================================
    // 2. DEFINE COURSES
    // =====================================

    const courses = [
      {
        title: 'Cybersecurity Fundamentals',
        description: 'Learn the basics of cybersecurity and online protection.',
        category: 'Security',
        difficulty: 'BEGINNER',
        skills: ['Cybersecurity', 'Networking'],
      },
      {
        title: 'Network Security',
        description: 'Understand networking concepts and network protection.',
        category: 'Networking',
        difficulty: 'MEDIUM',
        skills: ['Networking', 'Cybersecurity'],
      },
      {
        title: 'Python Programming',
        description: 'Learn Python programming from the basics.',
        category: 'Programming',
        difficulty: 'BEGINNER',
        skills: ['Python'],
      },
      {
        title: 'JavaScript Fundamentals',
        description: 'Learn JavaScript programming fundamentals.',
        category: 'Programming',
        difficulty: 'BEGINNER',
        skills: ['JavaScript'],
      },
      {
        title: 'React Development',
        description: 'Build modern frontend applications using React.',
        category: 'Frontend',
        difficulty: 'MEDIUM',
        skills: ['React', 'JavaScript'],
      },
      {
        title: 'Database and SQL',
        description: 'Learn database concepts and SQL queries.',
        category: 'Database',
        difficulty: 'BEGINNER',
        skills: ['SQL'],
      },
      {
        title: 'Node.js Backend Development',
        description: 'Build backend applications using Node.js.',
        category: 'Backend',
        difficulty: 'MEDIUM',
        skills: ['Node.js', 'JavaScript'],
      },
    ];

    // =====================================
    // 3. CREATE COURSES AND MAP SKILLS
    // =====================================

    for (const courseData of courses) {
      const { skills: skillNames, ...courseDetails } = courseData;

      const existingCourse = await prisma.course.findFirst({
        where: {
          title: courseDetails.title,
        },
      });

      const course = existingCourse
        ? await prisma.course.update({
            where: { id: existingCourse.id },
            data: {
              ...courseDetails,
              status: 'PUBLISHED',
            },
          })
        : await prisma.course.create({
            data: {
              ...courseDetails,
              status: 'PUBLISHED',
            },
          });

      console.log(`Created/updated course: ${course.title}`);

      for (const skillName of skillNames) {
        const skill = await prisma.skill.findUnique({
          where: { name: skillName },
        });

        if (!skill) {
          throw new Error(`Skill not found: ${skillName}`);
        }

        await prisma.courseSkill.upsert({
          where: {
            courseId_skillId: {
              courseId: course.id,
              skillId: skill.id,
            },
          },
          update: {},
          create: {
            courseId: course.id,
            skillId: skill.id,
          },
        });
      }
    }

    console.log('All skill mappings completed!');

    // =====================================
    // 4. CREATE SAMPLE ASSESSMENT
    // =====================================

    const cybersecurityCourse = await prisma.course.findFirst({
      where: {
        title: 'Cybersecurity Fundamentals',
      },
    });

    if (!cybersecurityCourse) {
      throw new Error('Cybersecurity Fundamentals course not found');
    }

    // Find an ADMIN or TRAINER to be the assessment creator.
    // If none exists, createdById can safely remain null.
    const creator = await prisma.user.findFirst({
      where: {
        role: {
          in: ['ADMIN', 'TRAINER'],
        },
      },
    });

    const assessmentTitle = 'Cybersecurity Fundamentals - Practice Test';

    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        title: assessmentTitle,
        courseId: cybersecurityCourse.id,
      },
    });

    if (existingAssessment) {
      console.log('Sample assessment already exists. Skipping creation.');
    } else {
      await prisma.assessment.create({
        data: {
          title: assessmentTitle,
          description: 'Test your understanding of basic cybersecurity concepts.',
          type: 'COURSE',
          difficulty: 'BEGINNER',
          passingScore: 60,
          timeLimitMinutes: 10,
          courseId: cybersecurityCourse.id,
          createdById: creator ? creator.id : null,

          questions: {
            create: [
              {
                questionText: 'What is the main purpose of a firewall?',
                type: 'MCQ',
                difficulty: 'BEGINNER',
                points: 1,
                correctAnswer: 'To monitor and control network traffic',
                explanation: 'A firewall monitors and controls incoming and outgoing network traffic.',
                options: {
                  create: [
                    { optionText: 'To increase internet speed', isCorrect: false },
                    { optionText: 'To monitor and control network traffic', isCorrect: true },
                    { optionText: 'To create passwords', isCorrect: false },
                    { optionText: 'To store files', isCorrect: false },
                  ],
                },
              },
              {
                questionText: 'Which of these is the strongest password?',
                type: 'MCQ',
                difficulty: 'BEGINNER',
                points: 1,
                correctAnswer: 'T9#mP2@xL8!',
                explanation: 'A strong password uses a combination of uppercase and lowercase letters, numbers, and special characters.',
                options: {
                  create: [
                    { optionText: '12345678', isCorrect: false },
                    { optionText: 'password123', isCorrect: false },
                    { optionText: 'T9#mP2@xL8!', isCorrect: true },
                    { optionText: 'yourname', isCorrect: false },
                  ],
                },
              },
              {
                questionText: 'What does phishing attempt to do?',
                type: 'MCQ',
                difficulty: 'BEGINNER',
                points: 1,
                correctAnswer: 'Steal sensitive information through fake messages',
                explanation: 'Phishing uses deceptive messages or websites to trick people into revealing sensitive information.',
                options: {
                  create: [
                    { optionText: 'Improve computer performance', isCorrect: false },
                    { optionText: 'Steal sensitive information through fake messages', isCorrect: true },
                    { optionText: 'Update operating systems', isCorrect: false },
                    { optionText: 'Back up files', isCorrect: false },
                  ],
                },
              },
              {
                questionText: 'What does HTTPS provide?',
                type: 'MCQ',
                difficulty: 'BEGINNER',
                points: 1,
                correctAnswer: 'Encrypted communication between browser and website',
                explanation: 'HTTPS uses encryption to protect communication between a browser and a website.',
                options: {
                  create: [
                    { optionText: 'Unlimited internet speed', isCorrect: false },
                    { optionText: 'Free website hosting', isCorrect: false },
                    { optionText: 'Encrypted communication between browser and website', isCorrect: true },
                    { optionText: 'Automatic virus removal', isCorrect: false },
                  ],
                },
              },
              {
                questionText: 'Which of these is an example of multi-factor authentication?',
                type: 'MCQ',
                difficulty: 'BEGINNER',
                points: 1,
                correctAnswer: 'Password and a one-time verification code',
                explanation: 'Multi-factor authentication requires two or more different forms of verification.',
                options: {
                  create: [
                    { optionText: 'Using the same password twice', isCorrect: false },
                    { optionText: 'Password and a one-time verification code', isCorrect: true },
                    { optionText: 'Changing your username', isCorrect: false },
                    { optionText: 'Using two browsers', isCorrect: false },
                  ],
                },
              },
            ],
          },
        },
      });

      console.log('Cybersecurity assessment created successfully!');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
