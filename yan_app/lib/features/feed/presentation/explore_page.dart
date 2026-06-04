import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/yan_widgets.dart';

/// 搜索状态
class ExploreState {
  final String query;
  final List<TrendingTopic> trending;
  final List<UserSuggestion> users;
  final bool isLoading;

  const ExploreState({
    this.query = '',
    this.trending = const [],
    this.users = const [],
    this.isLoading = false,
  });

  ExploreState copyWith({
    String? query,
    List<TrendingTopic>? trending,
    List<UserSuggestion>? users,
    bool? isLoading,
  }) {
    return ExploreState(
      query: query ?? this.query,
      trending: trending ?? this.trending,
      users: users ?? this.users,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class TrendingTopic {
  final String category;
  final String title;
  final String? subtitle;
  final int posts;

  const TrendingTopic({
    required this.category,
    required this.title,
    this.subtitle,
    required this.posts,
  });
}

class UserSuggestion {
  final String name;
  final String handle;
  final String avatar;
  final String avatarBg;
  final String bio;
  final bool verified;
  final int followers;

  const UserSuggestion({
    required this.name,
    required this.handle,
    required this.avatar,
    required this.avatarBg,
    required this.bio,
    this.verified = false,
    required this.followers,
  });
}

class ExploreNotifier extends StateNotifier<ExploreState> {
  ExploreNotifier() : super(const ExploreState()) {
    _loadMockData();
  }

  void _loadMockData() {
    state = state.copyWith(
      trending: [
        const TrendingTopic(category: '科技', title: '#Flutter', subtitle: '58.3万帖', posts: 583000),
        const TrendingTopic(category: '娱乐', title: '周杰伦新专辑', subtitle: '热搜第一', posts: 234000),
        const TrendingTopic(category: '体育', title: 'NBA 总决赛', subtitle: '湖人 vs 勇士', posts: 189000),
        const TrendingTopic(category: '科技', title: '#ChatGPT5', subtitle: '180万帖', posts: 1800000),
        const TrendingTopic(category: '社会', title: '高考成绩公布', subtitle: '2026年高考', posts: 456000),
        const TrendingTopic(category: '游戏', title: '#原神4.0', subtitle: '78万帖', posts: 780000),
        const TrendingTopic(category: '音乐', title: 'Taylor Swift 新歌', subtitle: '120万帖', posts: 1200000),
        const TrendingTopic(category: '电影', title: '阿凡达3预告', subtitle: '95万帖', posts: 950000),
      ],
      users: [
        const UserSuggestion(name: '科技频道', handle: '@technews', avatar: '科', avatarBg: 'linear-gradient(135deg,#667eea,#764ba2)', bio: '每日推送最新科技资讯', verified: true, followers: 1250000),
        const UserSuggestion(name: '财经观察', handle: '@finance_daily', avatar: '财', avatarBg: 'linear-gradient(135deg,#43e97b,#38f9d7)', bio: '解读财经动态，洞察市场趋势', verified: true, followers: 890000),
        const UserSuggestion(name: '体育精选', handle: '@sports_center', avatar: '体', avatarBg: 'linear-gradient(135deg,#f093fb,#f5576c)', bio: 'NBA、世界杯、体育资讯全覆盖', verified: false, followers: 567000),
        const UserSuggestion(name: '娱乐星闻', handle: '@star_news', avatar: '娱', avatarBg: 'linear-gradient(135deg,#4facfe,#00f2fe)', bio: '明星八卦、影视资讯、综艺热点', verified: true, followers: 2340000),
      ],
    );
  }

  void search(String query) {
    state = state.copyWith(query: query);
  }
}

final exploreProvider = StateNotifierProvider<ExploreNotifier, ExploreState>((ref) {
  return ExploreNotifier();
});

/// 探索页
class ExplorePage extends ConsumerStatefulWidget {
  const ExplorePage({super.key});

  @override
  ConsumerState<ExplorePage> createState() => _ExplorePageState();
}

class _ExplorePageState extends ConsumerState<ExplorePage> {
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final exploreState = ref.watch(exploreProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: CustomScrollView(
        slivers: [
          // 搜索框
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: _SearchBar(
                controller: _searchController,
                focusNode: _focusNode,
                onChanged: (q) => ref.read(exploreProvider.notifier).search(q),
              ),
            ),
          ),
          // 趋势话题
          if (exploreState.query.isEmpty) ...[
            SliverToBoxAdapter(
              child: _SectionTitle(title: '热门话题'),
            ),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final topic = exploreState.trending[index];
                  return _TrendingItem(topic: topic);
                },
                childCount: exploreState.trending.length,
              ),
            ),
            SliverToBoxAdapter(
              child: _SectionTitle(title: '推荐关注'),
            ),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final user = exploreState.users[index];
                  return _UserSuggestionItem(user: user);
                },
                childCount: exploreState.users.length,
              ),
            ),
          ] else ...[
            // 搜索结果
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Text(
                    '搜索: ${exploreState.query}',
                    style: const TextStyle(color: AppColors.text2, fontSize: 15),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;

  const _SearchBar({required this.controller, required this.focusNode, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.bg2,
        borderRadius: BorderRadius.circular(9999),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const SizedBox(width: 16),
          const Icon(Icons.search, color: AppColors.text2, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              onChanged: onChanged,
              style: const TextStyle(fontSize: 16, color: AppColors.text),
              decoration: const InputDecoration(
                hintText: '搜索',
                hintStyle: TextStyle(color: AppColors.text2, fontSize: 16),
                border: InputBorder.none,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, color: AppColors.text2, size: 18),
            onPressed: () {
              controller.clear();
              onChanged('');
            },
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.text),
      ),
    );
  }
}

class _TrendingItem extends StatelessWidget {
  final TrendingTopic topic;

  const _TrendingItem({required this.topic});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {},
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              topic.category,
              style: const TextStyle(fontSize: 13, color: AppColors.text2),
            ),
            const SizedBox(height: 2),
            Text(
              topic.title,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.text),
            ),
            if (topic.subtitle != null) ...[
              const SizedBox(height: 2),
              Text(
                topic.subtitle!,
                style: const TextStyle(fontSize: 14, color: AppColors.text2),
              ),
            ],
            const SizedBox(height: 4),
            Text(
              formatCount(topic.posts) + ' 帖',
              style: const TextStyle(fontSize: 13, color: AppColors.text2),
            ),
          ],
        ),
      ),
    );
  }
}

class _UserSuggestionItem extends StatelessWidget {
  final UserSuggestion user;

  const _UserSuggestionItem({required this.user});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          YanAvatar(avatar: user.avatar, avatarBg: user.avatarBg, size: 48, fontSize: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        user.name,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.text),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (user.verified) const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Icon(Icons.verified, size: 16, color: AppColors.accent),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  user.handle,
                  style: const TextStyle(fontSize: 14, color: AppColors.text2),
                ),
                const SizedBox(height: 4),
                Text(
                  user.bio,
                  style: const TextStyle(fontSize: 14, color: AppColors.text, height: 1.3),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      formatCount(user.followers) + ' 粉丝',
                      style: const TextStyle(fontSize: 13, color: AppColors.text2),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.text,
                        borderRadius: BorderRadius.circular(9999),
                      ),
                      child: const Text(
                        '关注',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.bg),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

String formatCount(int count) {
  if (count >= 100000000) {
    return '${(count / 100000000).toStringAsFixed(1)}亿';
  } else if (count >= 10000) {
    return '${(count / 10000).toStringAsFixed(1)}万';
  } else if (count >= 1000) {
    return '${(count / 1000).toStringAsFixed(1)}千';
  }
  return count.toString();
}