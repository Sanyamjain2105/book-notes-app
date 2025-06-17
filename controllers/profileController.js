import db from "../config/database.js";

export async function renderProfile(req, res) {
    try {
        const userId = req.session.userId;
        
        // Get total number of books for the user
        const totalBooksQuery = "SELECT COUNT(*) as total_books FROM notes WHERE user_id = $1";
        const totalBooksResult = await db.query(totalBooksQuery, [userId]);
        const totalBooks = totalBooksResult.rows[0].total_books;
        
        // Get total number of notes/comments for the user
        const totalNotesQuery = "SELECT COUNT(*) as total_notes FROM booknotes WHERE user_id = $1";
        const totalNotesResult = await db.query(totalNotesQuery, [userId]);
        const totalNotes = totalNotesResult.rows[0].total_notes;
        
        // Get books with their note counts
        const booksWithNotesQuery = `
            SELECT 
                notes.id,
                notes.book_title,
                notes.author,
                notes.book_isbn,
                notes.book_rating,
                notes.book_notes_date,
                COUNT(booknotes.id) as note_count
            FROM notes 
            LEFT JOIN booknotes ON notes.id = booknotes.book_id 
            WHERE notes.user_id = $1 
            GROUP BY notes.id, notes.book_title, notes.author, notes.book_isbn, notes.book_rating, notes.book_notes_date
            ORDER BY notes.id DESC
        `;
        
        const booksWithNotesResult = await db.query(booksWithNotesQuery, [userId]);
        const booksWithNotes = booksWithNotesResult.rows;
        
        // Calculate average rating
        const avgRatingQuery = "SELECT AVG(book_rating) as avg_rating FROM notes WHERE user_id = $1 AND book_rating IS NOT NULL";
        const avgRatingResult = await db.query(avgRatingQuery, [userId]);
        const avgRating = avgRatingResult.rows[0].avg_rating ? parseFloat(avgRatingResult.rows[0].avg_rating).toFixed(1) : 0;
        
        // Get recent activity (last 5 books added)
        const recentBooksQuery = "SELECT book_title, book_notes_date FROM notes WHERE user_id = $1 ORDER BY id DESC LIMIT 5";
        const recentBooksResult = await db.query(recentBooksQuery, [userId]);
        const recentBooks = recentBooksResult.rows;
        
        res.render("profile.ejs", {
            user: req.session.user,
            totalBooks: parseInt(totalBooks),
            totalNotes: parseInt(totalNotes),
            booksWithNotes: booksWithNotes,
            avgRating: avgRating,
            recentBooks: recentBooks
        });
        
    } catch (error) {
        console.error("Error loading profile:", error);
        res.status(500).send("Internal Server Error");
    }
}
