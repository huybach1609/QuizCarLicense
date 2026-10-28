using System.ComponentModel.DataAnnotations;

namespace QuizCarLicense.DTOs.Api;

/// <summary>
/// Payload gửi tín hiệu nhịp tim (heartbeat) định kỳ từ client trình duyệt.
/// </summary>
public sealed record HeartbeatRequest
{
    /// <summary>
    /// Định danh phiên ẩn danh ngẫu nhiên của client.
    /// </summary>
    [Required]
    [MaxLength(64)]
    public required string ClientId { get; init; }
}

/// <summary>
/// Phản hồi số lượng người dùng đang trực tuyến.
/// </summary>
/// <param name="OnlineCount">Số lượng phiên đang hoạt động trong cửa sổ thời gian gần nhất.</param>
/// <param name="Timestamp">Thời điểm máy chủ ghi nhận.</param>
public sealed record OnlineCountResponse(
    int OnlineCount,
    DateTimeOffset Timestamp);
