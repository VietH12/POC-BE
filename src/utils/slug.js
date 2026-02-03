/**
 * Convert Vietnamese text to URL-friendly slug
 * Example: "Bác sĩ A" -> "bac-si-a"
 */
export const createSlug = (text) => {
    if (!text) return '';

    // Convert to lowercase
    let slug = text.toLowerCase();

    // Replace Vietnamese characters
    const vietnameseMap = {
        'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
        'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
        'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
        'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
        'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
        'đ': 'd',
        ' ': '-', '.': '-', ',': '-', '/': '-', '(': '', ')': '', '[': '', ']': '', '{': '', '}': '', '!': '', '?': '', '@': '', '#': '', '$': '', '%': '', '^': '', '&': '', '*': '', '+': '', '=': '', '~': '', '`': '', '\'': '', '"': '', ':': '', ';': '', '<': '', '>': ''
    };

    // Replace each character
    for (const [key, value] of Object.entries(vietnameseMap)) {
        slug = slug.replace(new RegExp(escapeRegex(key), 'g'), value);
    }

    // Remove any remaining special characters
    slug = slug.replace(/[^a-z0-9-]/g, '');

    // Remove consecutive dashes
    slug = slug.replace(/-+/g, '-');

    // Remove leading/trailing dashes
    slug = slug.replace(/^-+|-+$/g, '');

    return slug;
};

/**
 * Escape special regex characters
 */
const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Create room ID from user name with conflict handling
 * Example: "Bác sĩ A" -> "bac-si-a"
 * If exists: "bac-si-a-2", "bac-si-a-3", etc.
 */
export const createRoomIdFromUser = (userName, existingRoomIds = []) => {
    const baseSlug = createSlug(userName);

    if (!baseSlug) {
        // Fallback to random if slug is empty
        return `room-${Date.now()}`;
    }

    // Check if base slug is available
    if (!existingRoomIds.includes(baseSlug)) {
        return baseSlug;
    }

    // Find next available number
    let counter = 2;
    while (existingRoomIds.includes(`${baseSlug}-${counter}`)) {
        counter++;
    }

    return `${baseSlug}-${counter}`;
};

/**
 * Find room ID by user name (for joining)
 * Searches for rooms created by user with matching name
 */
export const findRoomByUserName = (userName, rooms) => {
    const slug = createSlug(userName);

    // Find exact match first
    if (rooms.has(slug)) {
        return slug;
    }

    // Find with number suffix (bac-si-a-2, bac-si-a-3, etc.)
    for (const [roomId, room] of rooms.entries()) {
        if (roomId.startsWith(slug + '-')) {
            // Check if this room was created by user with this name
            if (room.createdBy && createSlug(room.createdBy) === slug) {
                return roomId;
            }
        }
    }

    return null;
};
