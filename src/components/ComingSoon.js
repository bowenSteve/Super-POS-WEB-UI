import "../styles/comingSoon.css"

function ComingSoon({ pageName, icon, description }) {
    return (
        <div className="coming-soon-container">
            <div className="coming-soon-content">
                <div className="coming-soon-icon">{icon}</div>
                <h1 className="coming-soon-title">{pageName}</h1>
                <p className="coming-soon-description">
                    {description || "This feature is currently under development"}
                </p>
                <div className="coming-soon-badge">Coming Soon</div>
            </div>
        </div>
    )
}

export default ComingSoon
