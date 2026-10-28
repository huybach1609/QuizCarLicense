using System.Collections.Concurrent;
using QuizCarLicense.Repositories.Interfaces;

namespace QuizCarLicense.Repositories.Implementations;

/// <summary>
/// Quản lý phiên truy cập trong bộ nhớ không khóa (lock-free) qua ConcurrentDictionary.
/// </summary>
public sealed class OnlinePresenceService : IOnlinePresenceService
{
    private readonly ConcurrentDictionary<string, long> _sessions = new(StringComparer.Ordinal);
    private const long TtlMilliseconds = 65_000; // 65 giây timeout cho phiên không gửi heartbeat
    private long _lastCleanupTick = Environment.TickCount64;

    public int RecordHeartbeat(string clientId)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return GetOnlineCount();
        }

        var now = Environment.TickCount64;
        _sessions[clientId] = now;
        CleanupIfNeeded(now);
        return Math.Max(1, _sessions.Count);
    }

    public int GetOnlineCount()
    {
        var now = Environment.TickCount64;
        CleanupIfNeeded(now);
        return Math.Max(1, _sessions.Count);
    }

    private void CleanupIfNeeded(long now)
    {
        var last = Interlocked.Read(ref _lastCleanupTick);
        if (now - last < 15_000)
        {
            return;
        }

        if (Interlocked.CompareExchange(ref _lastCleanupTick, now, last) != last)
        {
            return;
        }

        var cutoff = now - TtlMilliseconds;
        foreach (var kvp in _sessions)
        {
            if (kvp.Value < cutoff)
            {
                _sessions.TryRemove(kvp.Key, out _);
            }
        }
    }
}
