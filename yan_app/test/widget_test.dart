import 'package:flutter_test/flutter_test.dart';
import 'package:yan_app/features/feed/presentation/feed_provider.dart';

void main() {
  group('FeedNotifier', () {
    test('initial state is correct', () {
      final notifier = FeedNotifier();
      expect(notifier.state.tweets, isEmpty);
      expect(notifier.state.isLoading, false);
      expect(notifier.state.hasMore, true);
      expect(notifier.state.page, 0);
    });
  });
}