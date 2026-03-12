const CLOUDFLARE_WORKER_URL_FOR_ADMIN = "https://voimeow-chatbot-api.YOUR_SUBDOMAIN.workers.dev";

const USE_TEST_MODE = false;

const MINIMUM_COMMENT_DELAY_MS = USE_TEST_MODE ? 10 * 1000 : 30 * 60 * 1000;
const MAXIMUM_COMMENT_DELAY_MS = USE_TEST_MODE ? 30 * 1000 : 120 * 60 * 1000;

const scheduledAdminCommentTimers = new Map();

function generateRandomDelayForAdminComment() {
  return Math.floor(
    Math.random() * (MAXIMUM_COMMENT_DELAY_MS - MINIMUM_COMMENT_DELAY_MS) + 
    MINIMUM_COMMENT_DELAY_MS
  );
}

async function generateAdminCommentUsingWorker({ postTitle, postContent, existingComments }) {
  const existingCommentsText = existingComments && existingComments.length > 0
    ? existingComments.map((comment, index) => `댓글${index + 1}: ${comment.author} - ${comment.text}`).join('\n')
    : '댓글 없음';

  const systemPrompt = `너는 VoiMeow 커뮤니티의 관리자야. 사용자들의 게시글에 적절한 댓글을 달아줘.

규칙:
1. 슬픈 제목이나 내용이면 공감하고 위로하는 댓글을 달아줘
2. 정보를 물어보는 글이면 도움이 되는 정보를 간단하게 한 줄로 요약해서 알려줘
3. 기존 댓글이 많은 경우, 제목, 내용, 댓글들을 모두 읽고 종합적인 관리자 의견을 달아줘
4. 비방이나 욕설이 섞인 경우 정중하지만 명확하게 경고하는 댓글을 달아줘
5. 댓글은 친근하고 따뜻하게 작성하되, 30자 이내로 간결하게 작성해줘
6. 이모지를 적절히 사용해줘

게시글 제목: ${postTitle}
게시글 내용: ${postContent}
기존 댓글:
${existingCommentsText}

위 내용을 바탕으로 관리자 댓글을 작성해줘. 댓글 내용만 출력하고, 다른 설명은 하지 마.`;

  const messages = [
    {
      role: "system",
      content: "너는 친절하고 전문적인 커뮤니티 관리자야."
    },
    {
      role: "user",
      content: systemPrompt
    }
  ];

  try {
    const apiResponse = await fetch(CLOUDFLARE_WORKER_URL_FOR_ADMIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error || apiResponse.statusText);
    }

    const responseData = await apiResponse.json();
    return responseData.message.trim();
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
    return "안녕하세요! 커뮤니티 관리자입니다. 좋은 글 감사합니다 😊";
  }
}

async function addAdminCommentToPost(postObject, allPostsArray) {
  if (!postObject) return;

  const adminCommentText = await generateAdminCommentUsingWorker({
    postTitle: postObject.title,
    postContent: postObject.content,
    existingComments: postObject.comments || []
  });

  const newAdminComment = {
    id: Date.now(),
    author: "관리자 🛡️",
    text: adminCommentText,
    isAdmin: true,
    createdAt: new Date()
  };

  if (!postObject.comments) {
    postObject.comments = [];
  }
  
  postObject.comments.push(newAdminComment);

  console.log(`[관리자 댓글 생성] 게시글 ID: ${postObject.id}, 제목: "${postObject.title}"`);
  console.log(`[댓글 내용] ${adminCommentText}`);

  if (typeof window.refreshCommunityPostsDisplay === 'function') {
    window.refreshCommunityPostsDisplay();
  }
}

function scheduleAdminCommentForPost(postObject, allPostsArray) {
  if (scheduledAdminCommentTimers.has(postObject.id)) {
    return;
  }

  const randomDelayMs = generateRandomDelayForAdminComment();
  
  console.log(`[관리자 댓글 예약] 게시글 ID: ${postObject.id}, 제목: "${postObject.title}"`);
  console.log(`[예약 시간] ${Math.round(randomDelayMs / 1000 / 60)}분 후`);

  const timerId = setTimeout(() => {
    addAdminCommentToPost(postObject, allPostsArray);
    scheduledAdminCommentTimers.delete(postObject.id);
  }, randomDelayMs);

  scheduledAdminCommentTimers.set(postObject.id, timerId);
}

function initializeAdminCommentSystemForPosts(postsArray) {
  postsArray.forEach((post) => {
    scheduleAdminCommentForPost(post, postsArray);
  });
}

function addAdminCommentToNewPost(newPostObject, allPostsArray) {
  scheduleAdminCommentForPost(newPostObject, allPostsArray);
}

window.initializeAdminCommentSystemForPosts = initializeAdminCommentSystemForPosts;
window.addAdminCommentToNewPost = addAdminCommentToNewPost;
