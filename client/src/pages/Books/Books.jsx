import { useState } from 'react'
import { Search, Filter, BookOpen } from 'lucide-react'

const Books = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')

    // Mock data
    const books = [
        {
            id: 1,
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            category: 'Fiction',
            isbn: '978-0-7432-7356-5',
            availableCopies: 3,
            totalCopies: 5,
            coverImage: null,
        },
        {
            id: 2,
            title: 'To Kill a Mockingbird',
            author: 'Harper Lee',
            category: 'Fiction',
            isbn: '978-0-06-112008-4',
            availableCopies: 2,
            totalCopies: 4,
            coverImage: null,
        },
        {
            id: 3,
            title: '1984',
            author: 'George Orwell',
            category: 'Fiction',
            isbn: '978-0-452-28423-4',
            availableCopies: 0,
            totalCopies: 3,
            coverImage: null,
        },
    ]

    const categories = ['All', 'Fiction', 'Non-Fiction', 'Science', 'History', 'Biography']

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Books</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Browse and search our collection of books
                </p>
            </div>

            {/* Search and Filters */}
            <div className="card">
                <div className="card-content">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search books..."
                                    className="input pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="sm:w-48">
                            <select
                                className="input"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book) => (
                    <div key={book.id} className="card hover:shadow-md transition-shadow">
                        <div className="card-content">
                            <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg mb-4">
                                {book.coverImage ? (
                                    <img
                                        src={book.coverImage}
                                        alt={book.title}
                                        className="h-full w-full object-cover rounded-lg"
                                    />
                                ) : (
                                    <BookOpen className="h-12 w-12 text-gray-400" />
                                )}
                            </div>
                            <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
                            <p className="text-sm text-gray-600 truncate">{book.author}</p>
                            <p className="text-xs text-gray-500 mt-1">{book.category}</p>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {book.availableCopies}/{book.totalCopies} available
                                </span>
                                <button
                                    className={`btn-sm ${book.availableCopies > 0
                                            ? 'btn-primary'
                                            : 'btn-secondary cursor-not-allowed'
                                        }`}
                                    disabled={book.availableCopies === 0}
                                >
                                    {book.availableCopies > 0 ? 'Borrow' : 'Unavailable'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Books
