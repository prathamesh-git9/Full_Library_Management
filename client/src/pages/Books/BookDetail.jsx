import { useParams } from 'react-router-dom'

const BookDetail = () => {
    const { id } = useParams()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Book Detail</h1>
            <p className="text-gray-600">Book ID: {id}</p>
            <p className="text-sm text-gray-500">This page will show detailed book information, reviews, and borrowing options.</p>
        </div>
    )
}

export default BookDetail
