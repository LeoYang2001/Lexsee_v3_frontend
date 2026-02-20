export const fetchAudioUrl = async (text: string, ifChina: boolean = false) => {
  // Update with your new AWS API Gateway endpoint
  const apiUrl = process.env.EXPO_PUBLIC_PHONETIC_API_ENDPOINT;
  if (!apiUrl) return alert("Phonetic API endpoint is not configured");
  const requestData = {
    text: text,
    ifChina: ifChina,
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (response.ok) {
      const data = await response.json();
      // Your Lambda returns { url, key, cached, ... }
      return data.url;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "TTS Error:",
        response.status,
        errorData.error || response.statusText,
      );
      return null;
    }
  } catch (error) {
    console.error("Network Error:", error);
    return null;
  }
};
