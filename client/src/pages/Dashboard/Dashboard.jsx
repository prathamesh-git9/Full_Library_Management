import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from '../../hooks/useAuth'
import { BookOpen, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

const Dashboard = () => {
    const { user, isAdmin, isLibrarian } = useAuth()
    const dispatch = useDispatch()

    // Mock data for now - will be replaced with actual API calls
    const stats = {
        currentBorrows: 3,
        overdueBorrows: 1,
        totalFines: 5.00,
        recentActivity: [
            { id: 1, book: 'The Great Gatsby', action: 'Borrowed', date: '2024-11-18' },
            { id: 2, book: 'To Kill a Mockingbird', action: 'Returned', date: '2024-11-17' },
            { id: 3, book: '1984', action: 'Reserved', date: '2024-11-16' },
        ]
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.firstName}!
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Here's what's happening with your library account today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card">
                    <div className="card-content">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <BookOpen className="h-8 w-8 text-primary-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Current Borrows
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.currentBorrows}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-content">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-8 w-8 text-warning-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Due Soon
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.currentBorrows}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-content">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-8 w-8 text-danger-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Overdue
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.overdueBorrows}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-content">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-8 w-8 text-success-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Fines
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        ${stats.totalFines.toFixed(2)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Recent Activity</h3>
                    <p className="card-description">
                        Your latest library activities
                    </p>
                </div>
                <div className="card-content">
                    <div className="flow-root">
                        <ul className="-mb-8">
                            {stats.recentActivity.map((activity, activityIdx) => (
                                <li key={activity.id}>
                                    <div className="relative pb-8">
                                        {activityIdx !== stats.recentActivity.length - 1 ? (
                                            <span
                                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                                aria-hidden="true"
                                            />
                                        ) : null}
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                                                    <BookOpen className="h-4 w-4 text-white" />
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        <span className="font-medium text-gray-900">
                                                            {activity.book}
                                                        </span>{' '}
                                                        was {activity.action.toLowerCase()}
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                    {activity.date}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
