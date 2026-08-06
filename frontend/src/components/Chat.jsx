import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useState, useEffect } from 'react'
import { Divide as Hamburger } from 'hamburger-react'
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
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
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [showConversations, setShowConversations] = useState(false);
    const [userData, setUserData] = useState({});
    const [conversations, setConversations] = useState({});
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messageText, setMessageText] = useState("");
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const [meResponse, conversationsResponse] = await Promise.all([
                fetch('/api/me'),
                fetch('/api/conversations')
            ]);

            if (!meResponse.ok) {
                console.error("Failed to fetch user data:", meResponse.status);
                return;
            } else if (!conversationsResponse.ok) {
                console.error("Failed to fetch conversations:", conversationsResponse.status);
                return;
            }

            const me = await meResponse.json();
            const conversationsData = await conversationsResponse.json();

            setUserData(me);

            const conversationsObj = {};
            conversationsData.conversations.forEach((conv) => {
                conversationsObj[conv.conversation_id] = {
                    ...conv,
                    messages: null
                };
            });
            setConversations((prev) => {
                const merged = { ...prev };
                conversationsData.conversations.forEach((conv) => {
                    merged[conv.conversation_id] = {
                        ...conv,
                        messages: merged[conv.conversation_id]?.messages ?? null
                    };
                });
                return merged;
            });
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (!socket || !selectedConversationId) return;

        socket.emit("joinConversation", selectedConversationId);

        return () => {
            socket.emit("leaveConversation", selectedConversationId);
        };
    }, [socket, selectedConversationId]);

    useEffect(() => {
        if (!socket) return;

        console.log("Subscribing to newMessage, socket id:", socket.id);

        function handleNewMessage(message) {
            console.log("newMessage received:", message.id, "on socket:", socket.id);

            setConversations((prev) => {
                const existing = prev[message.conversation_id];

                if (!existing) {
                    return {
                        ...prev,
                        [message.conversation_id]: {
                            conversation_id: message.conversation_id,
                            username: message.username,
                            encrypted_message: message.encrypted_message,
                            last_message_time: message.created_at,
                            messages: [message]
                        }
                    };
                }

                const alreadyExists = existing.messages?.some(m => m.id === message.id);
                if (alreadyExists) {
                    console.log("Duplicate detected, skipping:", message.id);
                    return prev;
                }

                return {
                    ...prev,
                    [message.conversation_id]: {
                        ...existing,
                        encrypted_message: message.encrypted_message,
                        last_message_time: message.created_at,
                        messages: existing.messages
                            ? [...existing.messages, message]
                            : existing.messages
                    }
                };
            });
        }

        socket.on("newMessage", handleNewMessage);

        return () => {
            console.log("Unsubscribing from newMessage, socket id:", socket.id);
            socket.off("newMessage", handleNewMessage);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        function handleNewConversation(conversation) {

            setConversations((prev) => ({
                ...prev,
                [conversation.conversation_id]: {
                    conversation_id: conversation.conversation_id,
                    username: conversation.username,
                    encrypted_message: "",
                    last_message_time: new Date(),
                    messages: []
                }
            }));

        }

        socket.on("newConversation", handleNewConversation);

        return () => {
            socket.off("newConversation", handleNewConversation);
        };

    }, [socket]);

    useEffect(() => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                credentials: "include"
            });
            const data = await response.json();
            setSearchResults(data);
        }, 300);

        return () => clearTimeout(timeout);
    }, [query]);

    async function selectConversation(id) {
        setSelectedConversationId(id);
        setShowConversations(false);

        if (socket) {
            socket.emit("joinConversation", id);
        }

        const response = await fetch(`/api/message/${id}`);

        if (!response.ok) {
            console.error("Failed to fetch messages:", response.status);
            return;
        }

        const messagesData = await response.json();

        setConversations((prev) => ({
            ...prev,
            [id]: {
                ...prev[id],
                messages: messagesData.messages
            }
        }));
    }

    async function sendMessage() {
        const trimmed = messageText.trim();
        if (!trimmed || !selectedConversationId) {
            return;
        }

        const response = await fetch("/api/sendMessage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: trimmed,
                conversationId: selectedConversationId
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Failed to send message:", data.error);
            return;
        }

        setMessageText("");
    }

    async function openConversation(targetUserId) {

        const response = await fetch("/api/conversations", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: targetUserId
            })
        });

        const conversation = await response.json();

        if (!response.ok) {
            console.error(conversation.error);
            return;
        }

        const id = conversation.conversationId;

        const messagesResponse = await fetch(`/api/message/${id}`, {
            credentials: "include"
        });

        const messagesData = await messagesResponse.json();

        setConversations((prev) => ({
            ...prev,
            [id]: {
                ...(prev[id] || {}),
                conversation_id: id,
                username: conversation.username,
                encrypted_message: messagesData.messages.length > 0
                    ? messagesData.messages[messagesData.messages.length - 1].encrypted_message
                    : "",
                last_message_time: messagesData.messages.length > 0
                    ? messagesData.messages[messagesData.messages.length - 1].created_at
                    : new Date(),
                messages: messagesData.messages
            }
        }));

        setSelectedConversationId(id);
        setShowConversations(false);

        if (socket) {
            socket.emit("joinConversation", id);
        }

        console.log({
            id,
            selectedConversationId,
            conversations
        });
    }

    async function handleLogout() {
        await logout();
        navigate('/auth');
    }

    const conversationList = Object.values(conversations)
        .filter((conv) => {
            if (!search.trim()) return true;

            const term = search.trim().toLowerCase();

            return (
                conv.username?.toLowerCase().includes(term) ||
                conv.encrypted_message?.toLowerCase().includes(term)
            );
        })
        .sort((a, b) => {
            return new Date(b.last_message_time) - new Date(a.last_message_time);
        });

    const activeConversation = selectedConversationId ? conversations[selectedConversationId] : null;
    const activeMessages = activeConversation?.messages ?? [];

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
                            <div className="d-flex align-items-center gap-2 mb-3 mt-3">

                                <div className="position-relative flex-grow-1">
                                    <Input
                                        className="rounded-pill ps-5"
                                        type="text"
                                        placeholder="Search conversations"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)} />

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
                                            hover: { width: 80, opacity: 1 }
                                        }}
                                        transition={{ duration: 0.25 }}
                                        style={{
                                            overflow: "hidden",
                                            whiteSpace: "nowrap"
                                        }}>
                                        <span className="m-2 mx-2">
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
                            {conversationList.map((conv) => (
                                <motion.div key={conv.conversation_id}
                                    whileTap={{ scale: 0.9 }}>
                                    <Card
                                        className='mt-2 mb-2'
                                        style={{ cursor: "pointer" }}
                                        onClick={() => selectConversation(conv.conversation_id)}>
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
                                                    }} />
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
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search users..."
                            />
                            <div>
                                {searchResults.map(user => (
                                    <div key={user.id} onClick={() => openConversation(user.id)}>
                                        {user.username}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>
                    <Col xs={12} lg={10} className={`flex-grow-1 bg-light border ${!showConversations ? '' : 'd-none d-lg-block'}`}>
                        <div className="h-100 p-2 message-card">
                            <Card className="h-100 position-relative d-flex flex-column">
                                <CardHeader>
                                    <div className="d-flex align-items-center">
                                        <img
                                            src='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                                            alt="profile"
                                            className="rounded-circle"
                                            style={{ width: "40px", height: "40px", objectFit: "cover" }} />
                                        <span className="fw-bold align-items-center m-2">{activeConversation?.username ?? "Válassz egy beszélgetést"}</span>

                                    </div>
                                </CardHeader>
                                <CardBody className="flex-grow-1 d-flex flex-column overflow-scroll hide-scrollbar justify-content-end" style={{ flexBasis: 0, minHeight: 0, paddingBottom: "4rem" }}>
                                    {activeMessages.map((message) => (
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
                                    <Input
                                        id="message"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                                        className="flex-grow-1"
                                        placeholder="Write a message..." />
                                    <Button onClick={sendMessage} color="primary">Send</Button>
                                </div>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}