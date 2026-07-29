import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react'
import { Divide as Hamburger } from 'hamburger-react'
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
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
    const [userData, setUserData] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const [meResponse, messagesResponse] = await Promise.all([
                fetch('/api/me'),
                fetch('/api/conversations')
            ]);

            if (!meResponse.ok) {
                console.error("Failed to user data:", meResponse.status);
                return;
            } else if (!messagesResponse.ok) {
                console.error("Failed to user data:", messagesResponse.status);
                return;
            }

            const me = await meResponse.json();
            const conversationsData = await messagesResponse.json();

            setUserData(me);
            setConversations(conversationsData.conversations);
        }

        fetchData();
    }, []);

    async function fetchMessages(id) {
        const response = await fetch(`/api/messages/${id}`);

        if (!response.ok) {
            console.error("Failed to fetch messages:", response.status);
            return;
        }

        const messagesData = await response.json();
        setMessages(messagesData.messages)

    }

    async function handleLogout() {
        await logout();
        navigate('/auth');
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
                                            <span className="fw-bold text-end">{userData.username}</span>
                                            <small className="text-muted text-end">ID: {userData.userId}</small>
                                        </div>

                                        <img
                                            src='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                                            alt="profile"
                                            className="rounded-circle"
                                            style={{ width: "40px", height: "40px", objectFit: "cover" }} />
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
                            <div className="d-flex align-items-center gap-2 mb-3">

                                <div className="position-relative flex-grow-1">
                                    <Input className="rounded-pill ps-5" type="text" placeholder="Search conversations" />

                                    <span className="position-absolute top-50 translate-middle-y ms-3 text-muted" >
                                        🔍
                                    </span>
                                </div>

                                <motion.div
                                    className="d-flex align-items-center rounded-pill border bg-white shadow-sm"
                                    initial="rest"
                                    whileHover="hover"
                                    whileTap={{ scale: 0.9 }}
                                    style={{
                                        height: "38px",
                                        cursor: "pointer"
                                    }}>
                                    <motion.div
                                        variants={{
                                            rest: { width: 0, opacity: 0 },
                                            hover: { width: 75, opacity: 1 }
                                        }}
                                        transition={{ duration: 0.25 }}
                                        style={{
                                            overflow: "hidden",
                                            whiteSpace: "nowrap"
                                        }}>
                                        <span className="m-2">
                                            New chat
                                        </span>
                                    </motion.div>

                                    <motion.div
                                        variants={{
                                            rest: { rotate: 0 },
                                            hover: { rotate: 180 }
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className="px-2 d-flex">
                                        <Plus size={24} />
                                    </motion.div>
                                </motion.div>
                            </div>
                            {conversations.map((conv) => (
                                <motion.div
                                    whileTap={{ scale: 0.9 }}>
                                    <Card key={conv.conversation_id} className='mt-2 mb-2' style={{ cursor: "pointer" }} onClick={() => fetchMessages(conv.conversation_id) && setShowConversations(!showConversations)}>
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
                                                        {conv.encrypted_message}
                                                    </small>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </Col>

                    <Col xs={12} lg={10} className={`flex-grow-1 bg-light border ${!showConversations ? '' : 'd-none d-lg-block'}`}>
                        <div className='h-100 p-2 message-card'>
                            <Card className="h-100 position-relative overflow-hidden">
                                <CardBody className="overflow-auto pb-5 d-flex flex-column justify-content-end">
                                    {messages.map((message) => (
                                        <div key={message.id} className={`d-flex mb-2 ${message.sender_id == userData.userId
                                            ? "justify-content-end"
                                            : "justify-content-start"}`}>
                                            <div className={`p-2 px-3 rounded-4 ${message.sender_id == userData.userId
                                                ? "bg-primary text-white rounded-bottom-4"
                                                : "bg-light text-dark rounded-bottom-4 border"
                                                }`} style={{ maxWidth: "70%" }}>
                                                {message.encrypted_message}
                                            </div>
                                        </div>
                                    ))}
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