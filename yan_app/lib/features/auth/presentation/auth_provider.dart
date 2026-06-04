import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/user.dart';

/// 认证状态
enum AuthStatus { unknown, loggedIn, guest }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;
  final bool isLoading;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
    this.isLoading = false,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
    bool? isLoading,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

/// 认证 Provider（使用 SharedPreferences 持久化）
class AuthNotifier extends StateNotifier<AuthState> {
  static const _sessionKey = 'yan_current_user';
  static const _usersKey = 'yan_auth_users';

  AuthNotifier() : super(const AuthState()) {
    _loadSession();
  }

  Future<void> _loadSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final sessionJson = prefs.getString(_sessionKey);
      if (sessionJson != null) {
        final user = User.fromJson(jsonDecode(sessionJson) as Map<String, dynamic>);
        state = state.copyWith(status: AuthStatus.loggedIn, user: user);
      } else {
        state = state.copyWith(status: AuthStatus.guest);
      }
    } catch (e) {
      state = state.copyWith(status: AuthStatus.guest);
    }
  }

  Future<void> loginWithEmail(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final prefs = await SharedPreferences.getInstance();
      final usersJson = prefs.getString(_usersKey);
      if (usersJson == null) throw Exception('账号未注册，请先注册');

      final users = jsonDecode(usersJson) as Map<String, dynamic>;
      final userData = users[email] as Map<String, dynamic>?;
      if (userData == null) throw Exception('账号未注册，请先注册');

      if (userData['password'] != password) throw Exception('密码错误');

      final user = User.fromJson(userData);
      await prefs.setString(_sessionKey, jsonEncode(user.toJson()));
      state = state.copyWith(status: AuthStatus.loggedIn, user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> registerWithEmail(String email, String password, String name) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final prefs = await SharedPreferences.getInstance();
      final usersJson = prefs.getString(_usersKey);
      final users = usersJson != null
        ? jsonDecode(usersJson) as Map<String, dynamic>
        : <String, dynamic>{};

      if (users.containsKey(email)) throw Exception('该账号已注册');

      final gradients = [
        'linear-gradient(135deg,#667eea,#764ba2)',
        'linear-gradient(135deg,#f093fb,#f5576c)',
        'linear-gradient(135deg,#4facfe,#00f2fe)',
        'linear-gradient(135deg,#43e97b,#38f9d7)',
      ];
      final avatarBg = gradients[DateTime.now().millisecond % gradients.length];

      final user = User(
        identifier: email,
        type: 'email',
        handle: '@${email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '')}',
        name: name,
        avatarBg: avatarBg,
        createdAt: DateTime.now(),
      );

      users[email] = {
        ...user.toJson(),
        'password': password,
      };
      await prefs.setString(_usersKey, jsonEncode(users));
      await prefs.setString(_sessionKey, jsonEncode(user.toJson()));
      state = state.copyWith(status: AuthStatus.loggedIn, user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_sessionKey);
    } finally {
      state = const AuthState(status: AuthStatus.guest);
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

final isLoggedInProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).status == AuthStatus.loggedIn;
});

final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});