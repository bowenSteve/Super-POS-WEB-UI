import Sidebar from "../components/Sidebar"
import ComingSoon from "../components/ComingSoon"

function Reports() {
    return (
        <div className="home-container">
            <Sidebar />
            <div className="main-wrapper">
                <ComingSoon
                    pageName="Reports & Analytics"
                    icon="📊"
                    description="View sales reports, analytics, and business insights"
                />
            </div>
        </div>
    )
}

export default Reports
