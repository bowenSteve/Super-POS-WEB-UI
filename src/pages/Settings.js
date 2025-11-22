import Sidebar from "../components/Sidebar"
import ComingSoon from "../components/ComingSoon"

function Settings() {
    return (
        <div className="home-container">
            <Sidebar />
            <div className="main-wrapper">
                <ComingSoon
                    pageName="Settings"
                    icon="⚙️"
                    description="Configure system preferences and application settings"
                />
            </div>
        </div>
    )
}

export default Settings
