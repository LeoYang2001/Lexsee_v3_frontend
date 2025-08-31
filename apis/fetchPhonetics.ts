export const fetchAudioUrl = async (text: string) => {
  const apiUrl =
    "https://converttexttospeech-lcwrfk4hzq-uc.a.run.app/convert-text-to-speech";

  // Prepare the request payload
  const requestData = {
    text: text,
  };

  try {
    // Send POST request to the API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Set the content type to JSON
      },
      body: JSON.stringify(requestData), // Convert the data to JSON
    });

    // Check if the response is OK (status 200-299)
    if (response.ok) {
      const data = await response.json(); // Parse the response JSON
      return data.audioUrl; // Return the audio URL
    } else {
      console.error(
        "Failed to fetch audio URL:",
        response.status,
        response.statusText
      );
      return null;
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};
