import Logger from './logger';

interface UserResponse {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  [key: string]: any;
}

/**
 * Fetches user information from the API based on user ID
 * @param userId The user ID to fetch information for
 * @param apiToken The API token for authentication
 * @param apiBaseUrl The base API URL
 * @returns Promise with user data including firstName
 */
export const fetchUserInfo = async (
  userId: string, 
  apiToken: string,
  apiBaseUrl: string
): Promise<UserResponse> => {
  if (!userId || !apiToken || !apiBaseUrl) {
    Logger.warn('Missing parameters for user API call', {
      hasUserId: !!userId,
      hasApiToken: !!apiToken,
      hasBaseUrl: !!apiBaseUrl
    });
    return {};
  }

  try {
    // Construct the full endpoint URL using the specified format
    const endpoint = `${apiBaseUrl}/public-api/resources/users/v1.0/${userId}`;
    Logger.info('Fetching user info', { userId, endpoint });
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      Logger.error('API error fetching user info', new Error(errorText), {
        status: response.status,
        statusText: response.statusText,
        userId
      });
      return {};
    }

    const userData = await response.json();
    Logger.info('User info fetched successfully', {
      userId,
      hasFirstName: !!userData.firstName,
      dataFields: Object.keys(userData)
    });
    
    return userData;
  } catch (error) {
    Logger.error('Exception fetching user info', error as Error, { userId });
    return {};
  }
};
