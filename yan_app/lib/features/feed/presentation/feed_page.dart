import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/yan_widgets.dart';
import '../../../core/constants/app_constants.dart';
import '../domain/tweet.dart';
import 'feed_provider.dart';

/// 首页 Feed 页
class FeedPage extends ConsumerStatefulWidget {
  const FeedPage({super.key});

  @override
  ConsumerState<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends ConsumerState<FeedPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(feedProvider.notifier).loadFeed(refresh: true));
  }

  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(feedProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('言', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: _TabBar(
            activeTab: feedState.tab,
            onTabChanged: (tab) {
              ref.read(feedProvider.notifier).switchTab(tab);
            },
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(feedProvider.notifier).loadFeed(refresh: true),
        child: ListView.builder(
          itemCount: feedState.tweets.length + (feedState.hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == feedState.tweets.length) {
              // 加载更多
              if (!feedState.isLoading) {
                Future.microtask(() => ref.read(feedProvider.notifier).loadFeed());
              }
              return const Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.accent),
                ),
              );
            }
            final tweetData = feedState.tweets[index];
            return _TweetCard(
              tweet: tweetData,
              onLike: () => ref.read(feedProvider.notifier).likeTweet(feedState.tweets[index].id),
              onRetweet: () => ref.read(feedProvider.notifier).retweetTweet(feedState.tweets[index].id),
              onBookmark: () => ref.read(feedProvider.notifier).toggleBookmark(feedState.tweets[index].id),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/compose'),
        backgroundColor: AppColors.accent,
        child: const Icon(Icons.add, color: AppColors.bg),
      ),
    );
  }
}

class _TabBar extends StatelessWidget {
  final String activeTab;
  final ValueChanged<String> onTabChanged;

  const _TabBar({required this.activeTab, required this.onTabChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          _Tab(label: '为你推荐', isActive: activeTab == 'foryou', onTap: () => onTabChanged('foryou')),
          _Tab(label: '正在关注', isActive: activeTab == 'following', onTap: () => onTabChanged('following')),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _Tab({required this.label, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? AppColors.text : AppColors.text2,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Tweet 卡片
class _TweetCard extends StatelessWidget {
  final Tweet tweet;
  final VoidCallback onLike;
  final VoidCallback onRetweet;
  final VoidCallback onBookmark;

  const _TweetCard({
    required this.tweet,
    required this.onLike,
    required this.onRetweet,
    required this.onBookmark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 头像
          YanAvatar(
            avatar: tweet.avatar,
            avatarBg: tweet.avatarBg,
            size: 40,
            fontSize: 16,
          ),
          const SizedBox(width: 12),
          // 内容
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 名字 + 时间
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        tweet.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: AppColors.text,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (tweet.verified)
                      const Padding(
                        padding: EdgeInsets.only(left: 2),
                        child: Icon(Icons.verified, size: 16, color: AppColors.accent),
                      ),
                    const SizedBox(width: 4),
                    Text(
                      '${tweet.handle} · ${formatTime(tweet.createdAt)}',
                      style: const TextStyle(fontSize: 15, color: AppColors.text2),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                // 正文
                InkWell(
                  onTap: () => context.push('/tweet/${tweet.id}'),
                  child: Text(
                    tweet.text,
                    style: const TextStyle(fontSize: 15, height: 1.5, color: AppColors.text),
                  ),
                ),
                // 互动栏
                const SizedBox(height: 12),
                Row(
                  children: [
                    _ActionItem(
                      icon: Icons.chat_bubble_outline,
                      count: tweet.replies,
                      onTap: () => context.push('/tweet/${tweet.id}'),
                      activeIcon: Icons.chat_bubble,
                      isActive: false,
                      activeColor: AppColors.text2,
                    ),
                    const SizedBox(width: 4),
                    _ActionItem(
                      icon: Icons.repeat,
                      count: tweet.retweets,
                      onTap: onRetweet,
                      activeIcon: Icons.repeat,
                      isActive: tweet.retweeted,
                      activeColor: AppColors.green,
                    ),
                    const SizedBox(width: 4),
                    _ActionItem(
                      icon: Icons.favorite_border,
                      count: tweet.likes,
                      onTap: onLike,
                      activeIcon: Icons.favorite,
                      isActive: tweet.liked,
                      activeColor: AppColors.pink,
                    ),
                    const SizedBox(width: 4),
                    _ActionItem(
                      icon: Icons.bar_chart,
                      count: 0,
                      onTap: () {},
                      activeIcon: Icons.bar_chart,
                      isActive: false,
                      activeColor: AppColors.text2,
                    ),
                    const SizedBox(width: 4),
                    _ActionItem(
                      icon: Icons.bookmark_border,
                      count: 0,
                      onTap: onBookmark,
                      activeIcon: Icons.bookmark,
                      isActive: tweet.bookmarked,
                      activeColor: AppColors.accent,
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

class _ActionItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final int count;
  final bool isActive;
  final Color activeColor;
  final VoidCallback onTap;

  const _ActionItem({
    required this.icon,
    required this.activeIcon,
    required this.count,
    required this.isActive,
    required this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusPill),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isActive ? activeIcon : icon,
                size: 18,
                color: isActive ? activeColor : AppColors.text2,
              ),
              if (count > 0) ...[
                const SizedBox(width: 4),
                Text(
                  formatCount(count),
                  style: TextStyle(
                    fontSize: 13,
                    color: isActive ? activeColor : AppColors.text2,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}