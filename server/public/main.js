async function getWeather() {
    const city = document.getElementById('city').value;
    if (!city) {
        alert("도시 또는 주소를 입력하세요!");
        return;
    }

    try {
        console.log(`🔄 요청 중: /api/weather?address=${city}`); // ✅ 로그 추가

        // API 요청
        const response = await fetch(`/api/weather?address=${city}`);
        const data = await response.json();

        console.log("✅ 서버 응답:", data); // ✅ 서버 응답 로그 추가

        // 에러 처리
        if (data.error) {
            document.getElementById('weather-result').textContent = data.error;
            return;
        }

        // 🌤 날씨 정보 표시
        document.getElementById('weather-result').innerHTML = `
            <h2>${sanitizeHTML(data.weather.name)} (${sanitizeHTML(data.weather.main.temp)}°C)</h2>
            <p>날씨: ${sanitizeHTML(data.weather.weather[0].description)}</p>
        `;

        // 📚 책 추천 정보 표시
        const book = data.book_recommendation;
        document.getElementById('book-recommendation').innerHTML = `
            <h3>📚 추천 도서: ${sanitizeHTML(book.title)}</h3>
            <p>저자: ${sanitizeHTML(book.author)}</p>
            <p>설명: ${sanitizeHTML(book.description)}</p>
            <p><strong>추천 이유:</strong> ${sanitizeHTML(book.reason)}</p>
        `;
    } catch (error) {
        console.error("❌ API 요청 실패:", error);
        document.getElementById('weather-result').textContent = "날씨 정보를 가져오는데 실패했습니다.";
    }
}

function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}
