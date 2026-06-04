import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/yan_widgets.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../feed/domain/tweet.dart';
import '../../feed/presentation/feed_provider.dart';

/// 用户资料页
class ProfilePage extends ConsumerStatefulWidget {
  final String? handle; // 传 handle 则查看他人资料，不传则查看自己

  const ProfilePage({super.key, this.handle});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _activeTab = 'posts';

  final _tabs = ['posts', 'replies', 'media', 'likes'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(() {
      setState(() => _activeTab = _tabs[_tabController.index]);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(currentUserProvider);
    final isOwnProfile = widget.handle == null || widget.handle == currentUser?.handle;

    // 如果查看自己，用当前登录用户数据；否则用 mock 他人数据
    final user = isOwnProfile ? currentUser : _buildMockUser(widget.handle ?? '@unknown');

    if (user == null) {
      return Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(backgroundColor: AppColors.bg),
        body: const Center(child: Text('用户不存在', style: TextStyle(color: AppColors.text2))),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverToBoxAdapter(child: _buildHeader(user, isOwnProfile)),
            SliverPersistentHeader(
              pinned: true,
              delegate: _TabBarDelegate(
                activeTab: _activeTab,
                onTabChanged: (tab) {
                  setState(() => _activeTab = tab);
                  _tabController.animateTo(_tabs.indexOf(tab));
                },
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: _tabs.map((tab) => _buildTabContent(tab, user)).toList(),
        ),
      ),
    );
  }

  Widget _buildHeader(user, bool isOwnProfile) {
    final coverGradients = [
      [const Color(0xFF1D9BF0), const Color(0xFFF5576C), const Color(0xFFA855F7)],
      [const Color(0xFF667EEA), const Color(0xFF764BA2)],
    ];

    return Column(
      children: [
        // 封面
        Container(
          height: 150,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: coverGradients[0],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        // 头像 + 编辑按钮行
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Transform.translate(
                offset: const Offset(0, -30),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.bg, width: 4),
                  ),
                  child: YanAvatar(
                    avatar: user.name.substring(0, 1),
                    avatarBg: user.avatarBg,
                    size: 80,
                    fontSize: 32,
                  ),
                ),
              ),
              Transform.translate(offset: const Offset(0, -20), child: _buildFollowButton(user, isOwnProfile)),
              if (isOwnProfile)
                Transform.translate(
                  offset: const Offset(0, -20),
                  child: IconButton(
                    icon: const Icon(Icons.settings_outlined, color: AppColors.text),
                    onPressed: () => context.push('/settings'),
                  ),
                ),
            ],
          ),
        ),
        // 用户信息
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(user.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.text)),
                  if (user.verified)
                    const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Icon(Icons.verified, size: 20, color: AppColors.accent),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Text(user.handle, style: const TextStyle(fontSize: 15, color: AppColors.text2)),
              if (user.bio.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(user.bio, style: const TextStyle(fontSize: 15, color: AppColors.text, height: 1.4)),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  if (user.location.isNotEmpty) ...[
                    const Icon(Icons.location_on_outlined, size: 16, color: AppColors.text2),
                    const SizedBox(width: 4),
                    Text(user.location, style: const TextStyle(fontSize: 14, color: AppColors.text2)),
                    const SizedBox(width: 16),
                  ],
                  const Icon(Icons.calendar_today_outlined, size: 16, color: AppColors.text2),
                  const SizedBox(width: 4),
                  Text('${user.joinedDate} 加入', style: const TextStyle(fontSize: 14, color: AppColors.text2)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _StatText(count: user.following, label: '关注', bold: true),
                  const SizedBox(width: 20),
                  _StatText(count: user.followers, label: '粉丝', bold: true),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildFollowButton(user, bool isOwnProfile) {
    if (isOwnProfile) {
      return OutlinedButton(
        onPressed: () => context.push('/edit-profile'),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.text,
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9999)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        ),
        child: const Text('编辑资料', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
      );
    }

    final isFollowing = ref.watch(followStateProvider).followingHandles.contains(user.handle);

    return ElevatedButton(
      onPressed: () => ref.read(followStateProvider.notifier).toggleFollow(user.handle),
      style: ElevatedButton.styleFrom(
        backgroundColor: isFollowing ? AppColors.bg : AppColors.text,
        foregroundColor: isFollowing ? AppColors.text : AppColors.bg,
        side: isFollowing ? const BorderSide(color: AppColors.border) : null,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9999)),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      ),
      child: Text(isFollowing ? '正在关注' : '关注', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
    );
  }

  Widget _buildTabContent(String tab, user) {
    final tweets = ref.watch(feedProvider).tweets;

    if (tweets.isEmpty) {
      return Center(
        child: Text(
          tab == 'posts' ? '还没有发布帖子' :
          tab == 'replies' ? '还没有回复' :
          tab == 'media' ? '还没有媒体' : '还没有喜欢的帖子',
          style: const TextStyle(color: AppColors.text2, fontSize: 15),
        ),
      );
    }

    return ListView.builder(
      itemCount: tweets.length,
      itemBuilder: (context, index) {
        final tweet = tweets[index];
        return _TweetCard(tweet: tweet);
      },
    );
  }

  _buildMockUser(String handle) {
    final gradients = [
      'linear-gradient(135deg,#667eea,#764ba2)',
      'linear-gradient(135deg,#f093fb,#f5576c)',
    ];
    return _MockUser(
      name: handle.replaceAll('@', ''),
      handle: handle,
      avatarBg: gradients[0],
      bio: '这是一个示例用户简介',
      location: '中国',
      joinedDate: '2023年7月',
      followers: 123,
      following: 456,
      verified: false,
    );
  }
}

class _MockUser {
  final String name, handle, avatarBg, bio, location, joinedDate;
  final int followers, following;
  final bool verified;
  _MockUser({
    required this.name,
    required this.handle,
    required this.avatarBg,
    required this.bio,
    required this.location,
    required this.joinedDate,
    required this.followers,
    required this.following,
    required this.verified,
  });
}

class _StatText extends StatelessWidget {
  final int count;
  final String label;
  final bool bold;

  const _StatText({required this.count, required this.label, this.bold = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          '$count',
          style: TextStyle(
            fontSize: 14,
            fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
            color: AppColors.text,
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 14, color: AppColors.text2)),
      ],
    );
  }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final String activeTab;
  final ValueChanged<String> onTabChanged;

  const _TabBarDelegate({required this.activeTab, required this.onTabChanged});

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final tabs = <Widget>[
      _buildTab('posts'),
      _buildTab('replies'),
      _buildTab('media'),
      _buildTab('likes'),
    ];
    return Container(
      color: AppColors.bg,
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5))),
      child: Row(children: tabs),
    );
  }

  Widget _buildTab(String tab) {
    final label = _getLabel(tab);
    final isActive = activeTab == tab;
    return Expanded(
      child: InkWell(
        onTap: () => onTabChanged(tab),
        child: Center(
          child: Text(label, style: TextStyle(fontSize: 15, fontWeight: isActive ? FontWeight.w700 : FontWeight.w500, color: isActive ? AppColors.text : AppColors.text2)),
        ),
      ),
    );
  }

  String _getLabel(String tab) {
    if (tab == 'posts') return '帖子';
    if (tab == 'replies') return '回复';
    if (tab == 'media') return '媒体';
    if (tab == 'likes') return '喜欢';
    return tab;
  }

  @override
  double get maxExtent => 48;

  @override
  double get minExtent => 48;

  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) => true;
}

/// Tweet 卡片（Profile 页用简版）
class _TweetCard extends StatelessWidget {
  final Tweet tweet;

  const _TweetCard({required this.tweet});

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
          YanAvatar(avatar: tweet.avatar, avatarBg: tweet.avatarBg, size: 40, fontSize: 16),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(tweet.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.text)),
                    if (tweet.verified) const Padding(padding: EdgeInsets.only(left: 2), child: Icon(Icons.verified, size: 16, color: AppColors.accent)),
                    Text(' ${tweet.handle} · ${formatTime(tweet.createdAt)}', style: const TextStyle(fontSize: 15, color: AppColors.text2)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(tweet.text, style: const TextStyle(fontSize: 15, height: 1.5, color: AppColors.text)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _ActionCount(icon: Icons.chat_bubble_outline, count: tweet.replies),
                    _ActionCount(icon: Icons.repeat, count: tweet.retweets, activeColor: tweet.retweeted ? AppColors.green : null),
                    _ActionCount(icon: tweet.liked ? Icons.favorite : Icons.favorite_border, count: tweet.likes, activeColor: tweet.liked ? AppColors.pink : null),
                    const _ActionCount(icon: Icons.bar_chart, count: 0),
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

class _ActionCount extends StatelessWidget {
  final IconData icon;
  final int count;
  final Color? activeColor;

  const _ActionCount({required this.icon, required this.count, this.activeColor});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, size: 16, color: activeColor ?? AppColors.text2),
          if (count > 0) ...[
            const SizedBox(width: 4),
            Text('$count', style: TextStyle(fontSize: 13, color: activeColor ?? AppColors.text2)),
          ],
        ],
      ),
    );
  }
}

/// 关注状态 Provider
class FollowState {
  final Set<String> followingHandles;

  const FollowState({this.followingHandles = const {}});

  FollowState copyWith({Set<String>? followingHandles}) {
    return FollowState(followingHandles: followingHandles ?? this.followingHandles);
  }
}

class FollowNotifier extends StateNotifier<FollowState> {
  FollowNotifier() : super(const FollowState());

  void toggleFollow(String handle) {
    final handles = Set<String>.from(state.followingHandles);
    if (handles.contains(handle)) {
      handles.remove(handle);
    } else {
      handles.add(handle);
    }
    state = state.copyWith(followingHandles: handles);
  }
}

final followStateProvider = StateNotifierProvider<FollowNotifier, FollowState>((ref) {
  return FollowNotifier();
});