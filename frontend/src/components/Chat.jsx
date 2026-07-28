import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react'
import { Divide as Hamburger } from 'hamburger-react'
import "../styles/messages.css"
import {
    Container,
    Row,
    Col,
    Input,
    Card,
    CardHeader,

    Nav,
    Navbar,
    NavbarBrand,
    Button,
    NavbarToggler,
    Collapse,
    UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    CardBody
} from 'reactstrap'

export default function Chat() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [showConversations, setShowConversations] = useState(false);
    const [data, setData] = useState([]);
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const [meResponse, messagesResponse] = await Promise.all([
                fetch('/api/me'),
                fetch('/api/conversations')
            ]);

            const me = await meResponse.json();
            const conversationsData = await messagesResponse.json();

            setData(me);
            setConversations(conversationsData.conversations);
        }

        fetchData();
    }, []);
    
    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    return (
        <div className="chat-page d-flex flex-column overflow-hidden">
            <Container fluid className="flex-grow-1 d-flex flex-column ">
                <Row>
                    <Navbar color="light" light expand>
                        <div className="d-lg-none">
                            <Hamburger toggled={showConversations} toggle={setShowConversations} distance="sm" />
                        </div>
                        <NavbarToggler onClick={() => { setIsOpen(!isOpen) }} />
                        <Collapse isOpen={isOpen} navbar>
                            <Nav className="ms-auto" navbar>
                                <UncontrolledDropdown nav inNavbar>
                                    <DropdownToggle nav caret className="d-flex align-items-center">
                                        <div className="d-flex flex-column me-3 text-start">
                                            <span className="fw-bold text-end">{data.username}</span>
                                            <small className="text-muted text-end">Rank sys</small>
                                        </div>

                                        <img
                                            src='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                                            alt="profile"
                                            className="rounded-circle"
                                            style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                        />
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        <DropdownItem onClick={handleLogout}>Logout</DropdownItem>
                                    </DropdownMenu>
                                </UncontrolledDropdown>
                            </Nav>
                        </Collapse>
                    </Navbar>
                </Row>
                <Row className="flex-grow-1 overflow-hidden position-relative">
                    <Col xs={12} lg={2} className={`bg-light border conversations-panel ${showConversations ? "show" : ""}`}>
                        <div>
                            <div className="d-flex align-items-center">
                                <h2 className="mb-0 text-truncate">Conversations</h2>
                            </div>
                            <Input className="form-control" type="text" placeholder="Search conversations" />
                            {conversations.map((conv) => (
                                <Card key={conv.conversation_id} className='mt-2 mb-2' style={{ cursor: "pointer" }}>
                                    <CardBody className="overflow-auto">
                                        <div className="d-flex align-items-center">
                                            <img
                                                src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                                                alt="profile"
                                                className="rounded-circle me-3"
                                                style={{
                                                    width: "40px",
                                                    height: "40px",
                                                    objectFit: "cover"
                                                }}
                                            />
                                            <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                                                <span className="fw-bold text-truncate">
                                                    {conv.username}
                                                </span>
                                                <small className="text-muted text-truncate">
                                                    Last Message
                                                </small>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </Col>

                    <Col xs={12} lg={10} className={`flex-grow-1 bg-light border ${!showConversations ? '' : 'd-none d-lg-block'}`}>
                        <div className='h-100 p-2 message-card'>
                            <Card className="h-100 position-relative overflow-hidden">
                                <CardBody className="overflow-auto pb-5">
                                    Messages...
                                </CardBody>

                                <div className="position-absolute bottom-0 start-0 end-0 p-2 d-flex gap-2 bg-light">
                                    <Input className="flex-grow-1" placeholder="Write a message..." />
                                    <Button color="primary">Send</Button>
                                </div>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}
{/* <Card className="h-100 position-relative">
    <CardBody className="overflow-auto">
        Messages...
    </CardBody>

    <div className="position-absolute bottom-0 w-100 p-3">
        <Input placeholder="Write a message..." />
    </div>
</Card> */}