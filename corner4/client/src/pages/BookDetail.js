import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import lamp from "../assets/lamp.png";
import bookIcon from "../assets/bookicon.png";
import "../styles/BookDetail.css";

const BookDetail = () => {
  const { title } = useParams();
  const [book, setBook] = useState(null);

  useEffect(() => {
    // API 요청
    const fetchBookDetails = async () => {
      try {
        const response = await axios.get(`/book/detail?title=${title}`);
        setBook(response.data);
      } catch (error) {
        console.error("도서 정보를 불러오는 중 오류 발생:", error);
      }
    };

    fetchBookDetails();

    // 더미 데이터 사용
    // setBook({
    //   title: decodeURIComponent(title),
    //   author: "저자 이름",
    //   publisher: "출판사",
    //   cover: "https://example.com/book-cover.jpg",
    //   reviews: [
    //     { nickname: "사용자1", rating: 5, comment: "정말 감동적이었어요!" },
    //     { nickname: "사용자2", rating: 4, comment: "흥미로운 내용이었습니다." },
    //   ],
    // });

  }, [title]);

  if (!book) return <p>도서 정보를 불러오는 중...</p>;

  return (
    <div className="main-container">
      {/* 헤더 */}
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

      {/* 도서 상세 정보 */}
      <div className="book-detail-container">
        <img src={book.cover && book.cover.startsWith('http') ? book.cover : ''} alt={book.title} className="book-cover" />
        <div className="book-info">
          <h2>{book.title}</h2>
          <p><strong>저자:</strong> {book.author}</p>
          <p><strong>출판사:</strong> {book.publisher}</p>
        </div>
      </div>

      {/* 감상평 섹션 */}
      <div className="reviews-section">
        <h3>감상평</h3>
        {book.reviews?.length > 0 ? (
          book.reviews.map((review, index) => (
            <div key={index} className="review">
              <p>⭐ {review.rating}</p>
              <p>{review.comment}</p>
              <p>- {review.nickname}</p>
            </div>
          ))
        ) : (
          <p>등록된 감상평이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default BookDetail;
