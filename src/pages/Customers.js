import Sidebar from "../components/Sidebar"
import ComingSoon from "../components/ComingSoon"

function Customers() {
    return (
        <div className="home-container">
            <Sidebar />
            <div className="main-wrapper">
                <ComingSoon
                    pageName="Customer Management"
                    icon="👥"
                    description="Manage customer information and purchase history"
                />
            </div>
        </div>
    )
}

export default Customers
