import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    const ProviderScope(
      child: YanApp(),
    ),
  );
}

class YanApp extends StatelessWidget {
  const YanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: '言',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: routerProvider,
    );
  }
}