require('dotenv').config();
const prisma = require('../src/config/prismaClient');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('[SEED] Starting seed...');

  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const guestPassword = await bcrypt.hash(
    process.env.GUEST_PASSWORD || 'GuestPass123!',
    10
  );

  const guestUser = await prisma.user.create({
    data: {
      username: 'guest_explorer',
      email: process.env.GUEST_EMAIL || 'guest@orbit.app',
      password: guestPassword,
      bio: 'Just browsing around Orbit',
      profilePicture: `https://api.dicebear.com/7.x/personas/svg?seed=guest`,
      isGuest: true,
    },
  });

  console.log(`Guest user created: ${guestUser.email}`);

  const defaultPassword = await bcrypt.hash('Password123!', 10);
  const users = [];

  for (let i = 0; i < 12; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet
      .username({ firstName, lastName })
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 20);

    const user = await prisma.user.create({
      data: {
        username: `${username}_${i}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: defaultPassword,
        bio: faker.lorem.sentence(),
        profilePicture: `https://api.dicebear.com/7.x/personas/svg?seed=${username}`,
      },
    });

    users.push(user);
  }

  users.push(guestUser);

  console.log(`Created ${users.length} users`);

  const followPairs = new Set();

  for (const user of users) {
    const count = faker.number.int({ min: 4, max: 7 });
    const others = users.filter((u) => u.id !== user.id);
    const targets = faker.helpers.arrayElements(others, count);

    for (const target of targets) {
      const key = `${user.id}-${target.id}`;
      if (!followPairs.has(key)) {
        followPairs.add(key);
        await prisma.follow.create({
          data: {
            followerId: user.id,
            followingId: target.id,
            status: 'ACCEPTED',
          },
        });
      }
    }
  }

  console.log(`Created ${followPairs.size} follow relationships`);

  const posts = [];

  for (const user of users) {
    const postCount = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < postCount; i++) {
      const includeImage = faker.datatype.boolean(0.3);
      const post = await prisma.post.create({
        data: {
          content: faker.lorem.paragraph({ min: 1, max: 3 }),
          imageUrl: includeImage
            ? `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/800/450`
            : null,
          authorId: user.id,
          createdAt: faker.date.recent({ days: 30 }),
        },
      });
      posts.push(post);
    }
  }

  console.log(`Created ${posts.length} posts`);

  let likeCount = 0;

  for (const post of posts) {
    const likerCount = faker.number.int({ min: 0, max: 8 });
    const likers = faker.helpers.arrayElements(users, likerCount);

    for (const liker of likers) {
      try {
        await prisma.like.create({
          data: { postId: post.id, userId: liker.id },
        });
        likeCount++;
      } catch (_) {
      }
    }
  }

  console.log(`Created ${likeCount} likes`);

  let commentCount = 0;

  for (const post of posts) {
    const count = faker.number.int({ min: 0, max: 4 });
    const commenters = faker.helpers.arrayElements(users, count);

    for (const commenter of commenters) {
      await prisma.comment.create({
        data: {
          content: faker.lorem.sentences({ min: 1, max: 2 }),
          postId: post.id,
          authorId: commenter.id,
          createdAt: faker.date.recent({ days: 20 }),
        },
      });
      commentCount++;
    }
  }

  console.log(`Created ${commentCount} comments`);
  console.log('Seed complete!');
  console.log(`Guest login: ${process.env.GUEST_EMAIL || 'guest@orbit.app'} / ${process.env.GUEST_PASSWORD || 'GuestPass123!'}`);
  console.log('Any seeded user password: Password123!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });