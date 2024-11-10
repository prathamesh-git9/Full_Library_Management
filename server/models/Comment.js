const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'Book is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        minlength: [10, 'Comment must be at least 10 characters long'],
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    },
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        likedAt: {
            type: Date,
            default: Date.now
        }
    }],
    dislikes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        dislikedAt: {
            type: Date,
            default: Date.now
        }
    }],
    replies: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: [5, 'Reply must be at least 5 characters long'],
            maxlength: [500, 'Reply cannot exceed 500 characters']
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: {
            type: Date,
            default: null
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function () {
    return this.likes.length;
});

// Virtual for dislike count
commentSchema.virtual('dislikeCount').get(function () {
    return this.dislikes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function () {
    return this.replies.length;
});

// Virtual for net score (likes - dislikes)
commentSchema.virtual('netScore').get(function () {
    return this.likes.length - this.dislikes.length;
});

// Indexes for better query performance
commentSchema.index({ book: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ rating: 1 });
commentSchema.index({ isApproved: 1, isActive: 1 });
commentSchema.index({ 'likes.user': 1 });
commentSchema.index({ 'dislikes.user': 1 });

// Compound index to prevent duplicate comments from same user on same book
commentSchema.index(
    { book: 1, user: 1 },
    { unique: true }
);

// Pre-save middleware to update book rating when comment is saved
commentSchema.post('save', async function () {
    try {
        const Book = mongoose.model('Book');
        await Book.findByIdAndUpdate(this.book, {
            $inc: { 'statistics.totalRatings': 1 }
        });

        // Recalculate average rating
        const comments = await this.constructor.find({
            book: this.book,
            isActive: true,
            isApproved: true
        });

        if (comments.length > 0) {
            const totalRating = comments.reduce((sum, comment) => sum + comment.rating, 0);
            const averageRating = totalRating / comments.length;

            await Book.findByIdAndUpdate(this.book, {
                'statistics.averageRating': Math.round(averageRating * 10) / 10 // Round to 1 decimal
            });
        }
    } catch (error) {
        console.error('Error updating book rating:', error);
    }
});

// Pre-remove middleware to update book rating when comment is deleted
commentSchema.pre('remove', async function () {
    try {
        const Book = mongoose.model('Book');
        await Book.findByIdAndUpdate(this.book, {
            $inc: { 'statistics.totalRatings': -1 }
        });

        // Recalculate average rating
        const comments = await this.constructor.find({
            book: this.book,
            isActive: true,
            isApproved: true,
            _id: { $ne: this._id }
        });

        if (comments.length > 0) {
            const totalRating = comments.reduce((sum, comment) => sum + comment.rating, 0);
            const averageRating = totalRating / comments.length;

            await Book.findByIdAndUpdate(this.book, {
                'statistics.averageRating': Math.round(averageRating * 10) / 10
            });
        } else {
            await Book.findByIdAndUpdate(this.book, {
                'statistics.averageRating': 0
            });
        }
    } catch (error) {
        console.error('Error updating book rating on delete:', error);
    }
});

// Instance method to like a comment
commentSchema.methods.likeComment = function (userId) {
    // Remove from dislikes if present
    this.dislikes = this.dislikes.filter(dislike =>
        dislike.user.toString() !== userId.toString()
    );

    // Add to likes if not already present
    const alreadyLiked = this.likes.some(like =>
        like.user.toString() === userId.toString()
    );

    if (!alreadyLiked) {
        this.likes.push({ user: userId });
    }

    return this;
};

// Instance method to dislike a comment
commentSchema.methods.dislikeComment = function (userId) {
    // Remove from likes if present
    this.likes = this.likes.filter(like =>
        like.user.toString() !== userId.toString()
    );

    // Add to dislikes if not already present
    const alreadyDisliked = this.dislikes.some(dislike =>
        dislike.user.toString() === userId.toString()
    );

    if (!alreadyDisliked) {
        this.dislikes.push({ user: userId });
    }

    return this;
};

// Instance method to remove like/dislike
commentSchema.methods.removeReaction = function (userId) {
    this.likes = this.likes.filter(like =>
        like.user.toString() !== userId.toString()
    );
    this.dislikes = this.dislikes.filter(dislike =>
        dislike.user.toString() !== userId.toString()
    );

    return this;
};

// Instance method to add reply
commentSchema.methods.addReply = function (userId, content) {
    this.replies.push({
        user: userId,
        content: content
    });

    return this;
};

// Instance method to edit reply
commentSchema.methods.editReply = function (replyId, userId, newContent) {
    const reply = this.replies.id(replyId);

    if (!reply) {
        throw new Error('Reply not found');
    }

    if (reply.user.toString() !== userId.toString()) {
        throw new Error('You can only edit your own replies');
    }

    reply.content = newContent;
    reply.isEdited = true;
    reply.editedAt = new Date();

    return this;
};

// Instance method to delete reply
commentSchema.methods.deleteReply = function (replyId, userId) {
    const reply = this.replies.id(replyId);

    if (!reply) {
        throw new Error('Reply not found');
    }

    if (reply.user.toString() !== userId.toString()) {
        throw new Error('You can only delete your own replies');
    }

    this.replies.pull(replyId);

    return this;
};

// Static method to get comments by book
commentSchema.statics.getCommentsByBook = function (bookId, options = {}) {
    const query = {
        book: bookId,
        isActive: true,
        isApproved: true
    };

    const sort = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    return this.find(query)
        .populate('user', 'firstName lastName profileImage')
        .populate('replies.user', 'firstName lastName profileImage')
        .sort({ [sort]: sortOrder })
        .limit(options.limit || 20)
        .skip(options.skip || 0);
};

// Static method to get user's comments
commentSchema.statics.getUserComments = function (userId, options = {}) {
    const query = {
        user: userId,
        isActive: true
    };

    return this.find(query)
        .populate('book', 'title author coverImage')
        .sort({ createdAt: -1 })
        .limit(options.limit || 20)
        .skip(options.skip || 0);
};

// Static method to get comment statistics
commentSchema.statics.getCommentStats = function () {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalComments: { $sum: 1 },
                approvedComments: {
                    $sum: { $cond: ['$isApproved', 1, 0] }
                },
                averageRating: { $avg: '$rating' },
                totalLikes: { $sum: { $size: '$likes' } },
                totalDislikes: { $sum: { $size: '$dislikes' } }
            }
        }
    ]);
};

// Static method to get rating distribution
commentSchema.statics.getRatingDistribution = function (bookId = null) {
    const matchStage = bookId ? { book: mongoose.Types.ObjectId(bookId) } : {};

    return this.aggregate([
        { $match: { ...matchStage, isActive: true, isApproved: true } },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

module.exports = mongoose.model('Comment', commentSchema);
