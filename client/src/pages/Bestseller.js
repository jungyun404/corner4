import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Bestseller.css";
import bookIcon from "../assets/bookicon.png";
import lamp from "../assets/lamp.png";
import logo from "../assets/logo.png";
import axios from "axios";

const Bestseller = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [allBooks, setAllBooks] = useState([]);
  const navigate = useNavigate();


  const [currentPage, setCurrentPage] = useState(1);

  // API 호출하여 베스트셀러 목록 가져오기
  const fetchBestseller = async () => {
    try {
      const response = await axios.get('/book/bestseller?itemsPerPage=25', {
        headers: {
          'Cache-Control': 'no-cache', 
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
  
      console.log('받아온 데이터:', response.data); // 데이터 확인
      
      const items = response.data.item || response.data;
      setAllBooks(items); // 전체 25개 저장
      setBooks(items.slice(0, 5)); // 첫 페이지 1~5위 책만 표시
  
    } catch (error) {
      console.error("베스트셀러 목록 오류", error);
    }
  };
  

  // 페이지 로드 시 API 호출
  useEffect(() => {
    fetchBestseller();
  }, []);


  const handlePageChange = (page) => {
    setCurrentPage(page);
    const startIndex = (page - 1) * 5;
    setBooks(allBooks.slice(startIndex, startIndex + 5));
  };


  // 검색어가 변경될 때마다 자동으로 필터링
  useEffect(() => {
    if (searchTerm.trim() === "") {
      const startIndex = (currentPage - 1) * 5;
      setBooks(allBooks.slice(startIndex, startIndex + 5));
    } else {
      const filteredBooks = allBooks.filter((book) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setBooks(filteredBooks);
    }
  }, [searchTerm, allBooks, currentPage]);

  return (
    <div className="main-container">
      <header className="header">
        <div className="img-group">
          <img src={lamp} className="lamp" alt="lamp" />
          <img src={lamp} className="lamp" alt="lamp" />
          <img src={lamp} className="lamp" alt="lamp" />
        </div>
        <div className="nav-group">
          <div className="nav-item">
            <Link to="/bestseller">베스트셀러</Link>
            <img src={bookIcon} className="book-icon" alt="book icon" />
          </div>
          <div className="nav-item">
            <Link to="/test">북루미 테스트</Link>
            <div className="underline"></div>
          </div>
          <div className="nav-item">
            <Link to="/community">북작북작</Link>
            <div className="underline"></div>
          </div>
          <div className="nav-item">
            <Link to="/myDrawer">나의 서랍</Link>
            <div className="underline"></div>
          </div>
        </div>
      </header>

      <div className="bestseller-section">
        <div className="bestseller-header">
          <Link to="/">
            <img src={logo} className="logo" alt="로고" />
          </Link>
          <h2>이달의 베스트셀러</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <p className="weather">🔔오늘의 날씨는 : 책📚 읽기에 완벽한 맑은 날☀️</p>
        {/* 날씨 알림 */}
        <div className="book-list">
        {books.length > 0 ? (
            books.map((book, index) => (
              <div key={index} className="book-item">
                <span className="rank">{(currentPage - 1) * 5 + index + 1}</span>
                <img 
                  src={book.cover} 
                  alt={book.title} 
                  className="book-cover" 
                  onClick={() => navigate(`/book/${encodeURIComponent(book.title.replace(/[^a-zA-Z0-9 ]/g, ""))}`)}
                  style={{ cursor: "pointer" }}
                />
                <p 
                  className="book-title"
                  onClick={() => navigate(`/book/${encodeURIComponent(book.title.replace(/[^a-zA-Z0-9 ]/g, ""))}`)}
                  style={{ cursor: "pointer", fontSize: "15px" }}
                >
                  {book.title.split("-")[0].trim()}
                </p>
              </div>
            ))
          ) : (
            <p className="no-results">검색 결과가 없습니다.</p>
          )}
        </div>
        <div className="pagination">
          {[1, 2].map((page) => (
            <button
              key={page}
              className={currentPage === page ? "active" : ""}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>
</div>
</div>
);
};


export default Bestseller;

/* 데이터 크기에 따라 동적 코딩
<div className="pagination">
{Array.from({ length: Math.ceil(allBooks.length / 5) }, (_, i) => i + 1).map((page) => (
  <button
    key={page}
    className={currentPage === page ? "active" : ""}
    onClick={() => handlePageChange(page)}
  >
    {page}
  </button>
))}
  </div>
 */