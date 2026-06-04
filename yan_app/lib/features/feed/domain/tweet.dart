class Tweet {
  final String id;
  final String userId;
  final String name;
  final String handle;
  final bool verified;
  final String text;
  final DateTime createdAt;
  final String avatar;       // 首字符或 URL
  final String avatarBg;
  final String? avatarUrl;
  final int likes;
  final int retweets;
  final int replies;
  final String views;
  final bool liked;
  final bool retweeted;
  final bool bookmarked;
  final bool pinned;
  final List<TweetMedia>? media;
  final Poll? poll;
  final String? quoteTweetId;
  final bool edited;

  const Tweet({
    required this.id,
    required this.userId,
    required this.name,
    required this.handle,
    this.verified = false,
    required this.text,
    required this.createdAt,
    required this.avatar,
    required this.avatarBg,
    this.avatarUrl,
    this.likes = 0,
    this.retweets = 0,
    this.replies = 0,
    this.views = '0',
    this.liked = false,
    this.retweeted = false,
    this.bookmarked = false,
    this.pinned = false,
    this.media,
    this.poll,
    this.quoteTweetId,
    this.edited = false,
  });

  Tweet copyWith({
    String? id,
    String? userId,
    String? name,
    String? handle,
    bool? verified,
    String? text,
    DateTime? createdAt,
    String? avatar,
    String? avatarBg,
    String? avatarUrl,
    int? likes,
    int? retweets,
    int? replies,
    String? views,
    bool? liked,
    bool? retweeted,
    bool? bookmarked,
    bool? pinned,
    List<TweetMedia>? media,
    Poll? poll,
    String? quoteTweetId,
    bool? edited,
  }) {
    return Tweet(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      handle: handle ?? this.handle,
      verified: verified ?? this.verified,
      text: text ?? this.text,
      createdAt: createdAt ?? this.createdAt,
      avatar: avatar ?? this.avatar,
      avatarBg: avatarBg ?? this.avatarBg,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      likes: likes ?? this.likes,
      retweets: retweets ?? this.retweets,
      replies: replies ?? this.replies,
      views: views ?? this.views,
      liked: liked ?? this.liked,
      retweeted: retweeted ?? this.retweeted,
      bookmarked: bookmarked ?? this.bookmarked,
      pinned: pinned ?? this.pinned,
      media: media ?? this.media,
      poll: poll ?? this.poll,
      quoteTweetId: quoteTweetId ?? this.quoteTweetId,
      edited: edited ?? this.edited,
    );
  }

  factory Tweet.fromJson(Map<String, dynamic> json) => Tweet(
    id: json['id']?.toString() ?? '',
    userId: json['userId'] as String? ?? json['handle'] as String? ?? '',
    name: json['name'] as String? ?? '',
    handle: json['handle'] as String? ?? '',
    verified: json['verified'] as bool? ?? false,
    text: json['text'] as String? ?? '',
    createdAt: json['createdAt'] is DateTime
      ? json['createdAt'] as DateTime
      : json['createdAt'] != null
        ? DateTime.fromMillisecondsSinceEpoch(json['createdAt'] as int)
        : DateTime.now(),
    avatar: json['avatar'] as String? ?? '',
    avatarBg: json['avatarBg'] as String? ?? 'linear-gradient(135deg,#667eea,#764ba2)',
    avatarUrl: json['avatarUrl'] as String?,
    likes: json['likes'] as int? ?? 0,
    retweets: json['retweets'] as int? ?? 0,
    replies: json['replies'] as int? ?? 0,
    views: json['views'] as String? ?? '0',
    liked: json['liked'] as bool? ?? false,
    retweeted: json['retweeted'] as bool? ?? false,
    bookmarked: json['bookmarked'] as bool? ?? false,
    pinned: json['pinned'] as bool? ?? false,
    media: (json['media'] as List?)?.map((m) => TweetMedia.fromJson(m as Map<String, dynamic>)).toList(),
    poll: json['poll'] != null ? Poll.fromJson(json['poll'] as Map<String, dynamic>) : null,
    quoteTweetId: json['quoteTweetId'] as String?,
    edited: json['edited'] as bool? ?? false,
  );

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'name': name,
      'handle': handle,
      'verified': verified,
      'text': text,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'avatar': avatar,
      'avatarBg': avatarBg,
      'avatarUrl': avatarUrl,
      'likes': likes,
      'retweets': retweets,
      'replies': replies,
      'views': views,
      'liked': liked,
      'retweeted': retweeted,
      'bookmarked': bookmarked,
      'pinned': pinned,
      'poll': poll,
      'quoteTweetId': quoteTweetId,
      'edited': edited,
    };
  }
}

class TweetMedia {
  final String? url;
  final String? bg;
  final String? icon;

  const TweetMedia({this.url, this.bg, this.icon});

  factory TweetMedia.fromJson(Map<String, dynamic> json) => TweetMedia(
    url: json['url'] as String?,
    bg: json['bg'] as String?,
    icon: json['icon'] as String?,
  );
}

class Poll {
  final String tweetId;
  final String? endsIn;
  final List<PollOption> options;
  final int? voted;
  final bool hasEnded;

  const Poll({
    required this.tweetId,
    this.endsIn,
    required this.options,
    this.voted,
    this.hasEnded = false,
  });

  factory Poll.fromJson(Map<String, dynamic> json) => Poll(
    tweetId: json['tweetId'] as String? ?? '',
    endsIn: json['endsIn'] as String?,
    options: (json['options'] as List?)
      ?.map((o) => PollOption.fromJson(o as Map<String, dynamic>))
      .toList() ?? [],
    voted: json['voted'] as int?,
    hasEnded: json['hasEnded'] as bool? ?? false,
  );
}

class PollOption {
  final String label;
  final int votes;

  const PollOption({required this.label, this.votes = 0});

  factory PollOption.fromJson(Map<String, dynamic> json) => PollOption(
    label: json['label'] as String? ?? '',
    votes: json['votes'] as int? ?? 0,
  );
}