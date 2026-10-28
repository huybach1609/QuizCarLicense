namespace QuizCarLicense.Repositories.Interfaces;

/// <summary>
/// Giao diện dịch vụ theo dõi số lượng người dùng đang trực tuyến (in-memory sliding window).
/// </summary>
public interface IOnlinePresenceService
{
    /// <summary>
    /// Ghi nhận heartbeat từ một client và trả về số lượng người online hiện tại.
    /// </summary>
    /// <param name="clientId">Mã định danh client ẩn danh.</param>
    /// <returns>Số người online hiện tại.</returns>
    int RecordHeartbeat(string clientId);

    /// <summary>
    /// Lấy số lượng người dùng đang online tại thời điểm hiện tại.
    /// </summary>
    /// <returns>Số người online hiện tại.</returns>
    int GetOnlineCount();
}
