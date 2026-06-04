import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/tweet.dart';

class FeedState {
  final List<Tweet> tweets;
  final bool isLoading;
  final bool hasMore;
  final int page;
  final String tab; // 'foryou' | 'following'
  final String? error;
  final Map<String, List<Tweet>> replies; // tweetId -> replies

  const FeedState({
    this.tweets = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.page = 0,
    this.tab = 'foryou',
    this.error,
    this.replies = const {},
  });

  FeedState copyWith({
    List<Tweet>? tweets,
    bool? isLoading,
    bool? hasMore,
    int? page,
    String? tab,
    String? error,
    Map<String, List<Tweet>>? replies,
  }) {
    return FeedState(
      tweets: tweets ?? this.tweets,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      page: page ?? this.page,
      tab: tab ?? this.tab,
      error: error,
      replies: replies ?? this.replies,
    );
  }
}

class FeedNotifier extends StateNotifier<FeedState> {
  static const _pageSize = 8;

  FeedNotifier() : super(const FeedState());

  Future<void> loadFeed({bool refresh = false}) async {
    if (state.isLoading) return;
    if (!refresh && !state.hasMore) return;

    state = state.copyWith(isLoading: true, error: null);

    // 模拟网络延迟
    await Future.delayed(const Duration(milliseconds: 500));

    try {
      final newTweets = _buildMockTweets(
        page: refresh ? 0 : state.page,
        tab: state.tab,
      );

      state = state.copyWith(
        tweets: refresh ? newTweets : [...state.tweets, ...newTweets],
        isLoading: false,
        hasMore: newTweets.length >= _pageSize,
        page: refresh ? 0 : state.page + 1,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> switchTab(String tab) async {
    if (state.tab == tab) return;
    state = state.copyWith(tab: tab, page: 0, tweets: [], hasMore: true);
    await loadFeed(refresh: true);
  }

  Future<void> likeTweet(String tweetId) async {
    final idx = state.tweets.indexWhere((t) => t.id == tweetId);
    if (idx == -1) return;

    final tweet = state.tweets[idx];
    final updated = tweet.copyWith(
      liked: !tweet.liked,
      likes: tweet.liked ? tweet.likes - 1 : tweet.likes + 1,
    );

    final newTweets = [...state.tweets];
    newTweets[idx] = updated;
    state = state.copyWith(tweets: newTweets);
  }

  Future<void> retweetTweet(String tweetId) async {
    final idx = state.tweets.indexWhere((t) => t.id == tweetId);
    if (idx == -1) return;

    final tweet = state.tweets[idx];
    final updated = tweet.copyWith(
      retweeted: !tweet.retweeted,
      retweets: tweet.retweeted ? tweet.retweets - 1 : tweet.retweets + 1,
    );

    final newTweets = [...state.tweets];
    newTweets[idx] = updated;
    state = state.copyWith(tweets: newTweets);
  }

  Future<void> toggleBookmark(String tweetId) async {
    final idx = state.tweets.indexWhere((t) => t.id == tweetId);
    if (idx == -1) return;

    final tweet = state.tweets[idx];
    final newTweets = [...state.tweets];
    newTweets[idx] = tweet.copyWith(bookmarked: !tweet.bookmarked);
    state = state.copyWith(tweets: newTweets);
  }

  Future<void> addTweet(Tweet tweet) async {
    state = state.copyWith(tweets: [tweet, ...state.tweets]);
  }

  Future<void> addReply(String tweetId, Tweet reply) async {
    final existingReplies = state.replies[tweetId] ?? [];
    final updatedReplies = {...state.replies};
    updatedReplies[tweetId] = [reply, ...existingReplies];

    // Update reply count on the tweet
    final tweetIdx = state.tweets.indexWhere((t) => t.id == tweetId);
    List<Tweet> updatedTweets = [...state.tweets];
    if (tweetIdx != -1) {
      final tweet = state.tweets[tweetIdx];
      updatedTweets[tweetIdx] = tweet.copyWith(replies: tweet.replies + 1);
    }

    state = state.copyWith(tweets: updatedTweets, replies: updatedReplies);
  }

  List<Tweet> _buildMockTweets({required int page, required String tab}) {
    if (page >= 3) return [];

    final now = DateTime.now();
    final baseTime = now.subtract(Duration(minutes: page * 60));

    return List.generate(_pageSize, (i) {
      final idx = page * _pageSize + i;
      final tweetTime = baseTime.subtract(Duration(minutes: idx * 3));
      return Tweet(
        id: 't_$idx',
        userId: 'user_$idx',
        name: _names[idx % _names.length],
        handle: '@${_handles[idx % _handles.length]}',
        verified: idx % 5 == 0,
        text: _contents[idx % _contents.length],
        createdAt: tweetTime,
        avatar: _names[idx % _names.length].substring(0, 1),
        avatarBg: _gradients[idx % _gradients.length],
        likes: (idx * 37 + 12) % 500,
        retweets: (idx * 13 + 5) % 200,
        replies: (idx * 7 + 2) % 50,
        views: '${((idx * 1234 + 500) % 90000 / 10000).toStringAsFixed(1)}万',
        liked: idx % 7 == 0,
        retweeted: idx % 11 == 0,
        bookmarked: idx % 13 == 0,
      );
    });
  }

  static const _names = [
    '李明', '王芳', '张伟', '刘洋', '陈静',
    '杨帆', '赵磊', '黄丽', '周杰', '吴敏',
    '徐涛', '孙燕', '马超', '朱婷', '胡鹏',
  ];

  static const _handles = [
    'liming', 'wangfang', 'zhangwei', 'liuyang', 'chenjing',
    'yangfan', 'zhaolei', 'huangli', 'zhoujie', 'wumin',
    'xutao', 'sunyan', 'machao', 'zhuting', 'hupeng',
  ];

  static const _contents = [
    '今天天气真好，出门散步心情舒畅！☀️',
    '分享一篇关于 AI 发展的文章，值得一读。',
    '新买的键盘到了，打字手感绝了！✨',
    '周末准备去爬山，有没有一起的？🏔️',
    '学习 Flutter 已经两个月了，感觉进步很大！',
    '这部电影太震撼了，推荐大家去看！🎬',
    '今天尝试了一道新菜，成功！😋',
    '春天来了，花开得真美。🌸',
    '有人推荐好听的音乐吗？🎵',
    '健身第 30 天，给自己点赞！💪',
    '今天读了一本好书，收获很大。📚',
    '周末加班中，希望早点完成。💼',
    '今天遇到了一个很好的陌生人，心情很好。😊',
    '学习编程的路上，越战越勇！💻',
    '新的一年，新的目标。🎯',
  ];

  static const _gradients = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#fccb90,#d57eeb)',
    'linear-gradient(135deg,#e0c3fc,#8ec5fc)',
  ];
}

final feedProvider = StateNotifierProvider<FeedNotifier, FeedState>((ref) {
  return FeedNotifier();
});