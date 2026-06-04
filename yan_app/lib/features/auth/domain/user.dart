class User {
  final String identifier;  // phone or email
  final String type;       // 'phone' | 'email'
  final String handle;     // @username
  final String name;
  final String bio;
  final String location;
  final String? website;
  final String? avatarUrl;
  final String avatarBg;
  final bool verified;
  final String role;      // 'user' | 'admin'
  final int followers;
  final int following;
  final int posts;
  final int liked;
  final String joinedDate;
  final DateTime createdAt;

  const User({
    required this.identifier,
    required this.type,
    required this.handle,
    required this.name,
    this.bio = '',
    this.location = '',
    this.website,
    this.avatarUrl,
    required this.avatarBg,
    this.verified = false,
    this.role = 'user',
    this.followers = 0,
    this.following = 0,
    this.posts = 0,
    this.liked = 0,
    this.joinedDate = '',
    required this.createdAt,
  });

  User copyWith({
    String? identifier,
    String? type,
    String? handle,
    String? name,
    String? bio,
    String? location,
    String? website,
    String? avatarUrl,
    String? avatarBg,
    bool? verified,
    String? role,
    int? followers,
    int? following,
    int? posts,
    int? liked,
    String? joinedDate,
    DateTime? createdAt,
  }) {
    return User(
      identifier: identifier ?? this.identifier,
      type: type ?? this.type,
      handle: handle ?? this.handle,
      name: name ?? this.name,
      bio: bio ?? this.bio,
      location: location ?? this.location,
      website: website ?? this.website,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      avatarBg: avatarBg ?? this.avatarBg,
      verified: verified ?? this.verified,
      role: role ?? this.role,
      followers: followers ?? this.followers,
      following: following ?? this.following,
      posts: posts ?? this.posts,
      liked: liked ?? this.liked,
      joinedDate: joinedDate ?? this.joinedDate,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'identifier': identifier,
      'type': type,
      'handle': handle,
      'name': name,
      'bio': bio,
      'location': location,
      'website': website,
      'avatarUrl': avatarUrl,
      'avatarBg': avatarBg,
      'verified': verified,
      'role': role,
      'followers': followers,
      'following': following,
      'posts': posts,
      'liked': liked,
      'joinedDate': joinedDate,
      'createdAt': createdAt.millisecondsSinceEpoch,
    };
  }

  factory User.fromJson(Map<String, dynamic> json) => User(
    identifier: json['identifier'] as String,
    type: json['type'] as String,
    handle: json['handle'] as String,
    name: json['name'] as String,
    bio: json['bio'] as String? ?? '',
    location: json['location'] as String? ?? '',
    website: json['website'] as String?,
    avatarUrl: json['avatarUrl'] as String?,
    avatarBg: json['avatarBg'] as String,
    verified: json['verified'] as bool? ?? false,
    role: json['role'] as String? ?? 'user',
    followers: json['followers'] as int? ?? 0,
    following: json['following'] as int? ?? 0,
    posts: json['posts'] as int? ?? 0,
    liked: json['liked'] as int? ?? 0,
    joinedDate: json['joinedDate'] as String? ?? '',
    createdAt: json['createdAt'] is DateTime
      ? json['createdAt'] as DateTime
      : DateTime.fromMillisecondsSinceEpoch(json['createdAt'] as int),
  );
}